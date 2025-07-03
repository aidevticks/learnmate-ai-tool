import openai
import os

# Optional: Set your API key (or use env variable)
# os.environ["OPENAI_API_KEY"] = "your-api-key"

def get_embedding(text: str) -> list[float]:
    try:
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print("Embedding error:", e)
        return []