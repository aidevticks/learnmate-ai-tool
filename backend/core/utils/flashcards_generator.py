import ollama
import json

def generate_flashcards_from_text(text: str, model: str = "gemma:2b") -> list[dict]:
    prompt = (
        "Generate 10 flashcards (question-answer pairs) from the following text. "
        "Respond strictly in this JSON array format:\n"
        "[{\"question\": \"...\", \"answer\": \"...\"}, ...]\n\n"
        f"TEXT:\n{text[:4000]}"  # Ollama has a token limit – truncate if needed
    )

    response = ollama.chat(model=model, messages=[
        {"role": "user", "content": prompt}
    ])
    content = response["message"]["content"]

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return []
