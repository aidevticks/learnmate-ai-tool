import os
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

# === Embedding & LLM setup ===
embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# === Pinecone setup ===
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "learnmate"

# Create index if it doesn't exist
if index_name not in [i.name for i in pc.list_indexes()]:
    pc.create_index(
        name=index_name,
        dimension=1536,  # OpenAI text-embedding-3-small returns 1536-d vectors
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(name=index_name)

# === Function to upload text chunks to Pinecone ===
def index_pdf_content_to_pinecone(text, namespace):
    """
    Split extracted PDF text into chunks and upload to Pinecone.
    Each chunk is embedded and stored in the given namespace (usually file_id).
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(text)

    # Upload to Pinecone
    vectorstore = PineconeVectorStore.from_texts(
        texts=chunks,
        embedding=embedding_model,
        index_name=index_name,
        namespace=namespace
    )
    return len(chunks)

# === Function to query using conversational history ===
def query_pdf_content(question, namespace, history=[]):
    """
    Answer user's question using LLM and vector search with chat history.
    `history` should be a list of dictionaries like:
    [
        {"role": "user", "content": "..."},
        {"role": "bot", "content": "..."},
        ...
    ]
    """

    # Connect to existing Pinecone vectorstore
    vectorstore = PineconeVectorStore.from_existing_index(
        index_name=index_name,
        embedding=embedding_model,
        namespace=namespace
    )
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    # Prepare Conversational Chain
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        return_source_documents=False,
        return_generated_question=True,
        verbose=True
    )

    # Format chat history
    formatted_history = []
    for i in range(0, len(history) - 1, 2):
        if (
            history[i]["role"] == "user"
            and history[i + 1]["role"] == "bot"
            and history[i + 1]["content"].strip() != ""
        ):
            formatted_history.append((history[i]["content"], history[i + 1]["content"]))

    print("==== FORMATTED HISTORY ====")
    for q, a in formatted_history:
        print(f"Q: {q}\nA: {a}\n")

    if any(question == q for q, _ in formatted_history):
        print("⚠️ Warning: Question already appears in chat history!")

    # Run the query
    result = chain({
        "question": question,
        "chat_history": formatted_history
    })

    print("==== FINAL ANSWER ====")
    print(result)

    return result["answer"]
