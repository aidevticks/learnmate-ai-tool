from rest_framework import status
from .models import UploadedFile, Flashcard
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from .upload_file_serializer import UploadedFileSerializer
from .flashcards_serializer import FlashcardSerializer
from .utils.pdf_text_extracter import extract_text_from_pdf
from .utils.embedding import get_embedding 
from .utils.flashcards_generator import generate_flashcards_from_text
from .utils.quiz_generator import generate_mcqs_from_text
from .utils.notes_generator import generate_notes_from_text
from .utils.langchian_chatbot import index_pdf_content_to_pinecone
from .utils.langchian_chatbot import query_pdf_content


# Generate tokens manually
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    email = request.data.get('email')  # get email from request
    
    if password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    tokens = get_tokens_for_user(user)
    detail = {
        'username': user.username,
        'email': user.email,
    }
    return Response({'message': 'User registered successfully','detail':detail, 'tokens': tokens}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    username = request.data.get('username')
    user = authenticate(request, email=email, password=password)
    
    if user is not None:
        tokens = get_tokens_for_user(user)
        detail = {
            'username': user.username,
            'email': user.email,
        }
        return Response({'message': 'Login successful','detail':detail,'tokens': tokens})
    else:
        return Response({'error': 'Invalid credentials'}, status=401)

@api_view(['POST'])
def logout(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logout successful"})
    except Exception as e:
        return Response({"error": "Invalid token"}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pdf(request):
    serializer = UploadedFileSerializer(data=request.data)
    if serializer.is_valid():
        uploaded_file = serializer.save(user=request.user)

        # Call the utility function
        extracted_text = extract_text_from_pdf(uploaded_file.file.path, method='pdfplumber')  # 'pymupdf' or 'pdfplumber'

        # Get embedding from Ollama
        embedding = get_embedding(extracted_text)

        # Save extracted text to DB
        uploaded_file.extracted_text = extracted_text
        uploaded_file.embedding = embedding
        uploaded_file.save()

        # Re-serialize to include extracted_text
        updated_serializer = UploadedFileSerializer(uploaded_file)

        return Response({
            'file': serializer.data,
            'embedding_text': embedding,
            'extracted_text': extracted_text,
            "file_id": uploaded_file.id
        }, status=201)

    return Response(serializer.errors, status=400)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_flashcards(request):
    file_id = request.data.get("file_id")
    if not file_id:
        return Response({"error": "file_id is required"}, status=400)

    try:
        uploaded_file = UploadedFile.objects.get(id=file_id, user=request.user)
    except UploadedFile.DoesNotExist:
        return Response({"error": "File not found or not owned by user"}, status=404)

    # Use larger chunks to reduce LLM calls
    chunks = split_text_into_chunks(uploaded_file.extracted_text, chunk_size=1000)
    flashcard_instances = []

    for chunk in chunks:
        qa_pairs = generate_flashcards_from_text(chunk)
        for qa in qa_pairs:
            if qa.get("question") and qa.get("answer"):
                flashcard_instances.append(
                    Flashcard(
                        user=request.user,
                        question=qa["question"],
                        answer=qa["answer"],
                        source_file=uploaded_file
                    )
                )

    if flashcard_instances:
        Flashcard.objects.bulk_create(flashcard_instances)
        # Serialize created objects (optional preview)
        serialized = FlashcardSerializer(flashcard_instances, many=True).data
        return Response({"message": "New flashcards generated", "flashcards": serialized}, status=201)
    else:
        return Response({"message": "No flashcards generated"}, status=200)


def split_text_into_chunks(text, chunk_size=1000):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_mcq_quiz(request):
    file_id = request.data.get("file_id")
    if not file_id:
        return Response({"error": "file_id is required"}, status=400)

    try:
        uploaded_file = UploadedFile.objects.get(id=file_id, user=request.user)
    except UploadedFile.DoesNotExist:
        return Response({"error": "File not found or not owned by user"}, status=404)

    chunks = split_text_into_chunks(uploaded_file.extracted_text, chunk_size=1000)
    all_mcqs = []

    for chunk in chunks:
        mcqs = generate_mcqs_from_text(chunk)
        all_mcqs.extend(mcqs)

    if all_mcqs:
        return Response({
            "message": "MCQ quiz generated successfully",
            "quiz": all_mcqs[:20]  # Optional limit
        }, status=201)
    else:
        return Response({"message": "No MCQs generated"}, status=200)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_notes(request):
    file_id = request.data.get("file_id")
    if not file_id:
        return Response({"error": "file_id is required"}, status=400)

    try:
        uploaded_file = UploadedFile.objects.get(id=file_id, user=request.user)
    except UploadedFile.DoesNotExist:
        return Response({"error": "File not found or not owned by user"}, status=404)

    # Truncate long content to fit into context
    max_length = 10000
    content = uploaded_file.extracted_text
    if len(content) > max_length:
        content = content[:max_length]

    notes = generate_notes_from_text(content)

    return Response({
        "message": "Study notes generated successfully",
        "notes": notes
    }, status=201)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def index_pdf_to_vector_db(request):
    file_id = request.data.get("file_id")
    if not file_id:
        return Response({"error": "file_id is required"}, status=400)

    try:
        uploaded_file = UploadedFile.objects.get(id=file_id, user=request.user)
    except UploadedFile.DoesNotExist:
        return Response({"error": "File not found or not owned by user"}, status=404)

    chunks = index_pdf_content_to_pinecone(uploaded_file.extracted_text, namespace=str(file_id))
    return Response({"message": f"{chunks} chunks indexed to Pinecone."}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_pdf(request):
    file_id = request.data.get("file_id")
    question = request.data.get("question")
    history = request.data.get("history", [])

    if not file_id or not question:
        return Response({"error": "file_id and question are required"}, status=400)

    try:
        UploadedFile.objects.get(id=file_id, user=request.user)
    except UploadedFile.DoesNotExist:
        return Response({"error": "File not found or not owned by user"}, status=404)

    try:
        answer = query_pdf_content(question, namespace=str(file_id), history=history)
        return Response({"answer": answer}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
