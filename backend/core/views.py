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

    # 🔁 Generate new flashcards
    chunks = split_text_into_chunks(uploaded_file.extracted_text, chunk_size=500)
    flashcards = []

    for chunk in chunks:
        qa_pairs = generate_flashcards_from_text(chunk)
        for qa in qa_pairs:
            serializer = FlashcardSerializer(data={
                "user": request.user.id,
                "question": qa.get("question", ""),
                "answer": qa.get("answer", ""),
                "source_file": uploaded_file.id,
            })
            if serializer.is_valid():
                serializer.save()
                flashcards.append(serializer.data)

    return Response({"message": "new flashcards generated", "flashcards": flashcards}, status=201)



def split_text_into_chunks(text, chunk_size=500):
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
