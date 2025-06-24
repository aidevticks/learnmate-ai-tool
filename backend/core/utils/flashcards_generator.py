from langchain_core.prompts import PromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import JsonOutputParser
import json

# Prompt for generating JSON-style flashcards
template = """
Generate 10 flashcards from the following text.
Each flashcard should be a dictionary with a 'question' and 'answer'.
Return a JSON array in this format:
[
  {{"question": "...", "answer": "..."}},
  ...
]

Text:
{text}
"""

prompt = PromptTemplate.from_template(template)

# Setup Ollama with gemma:2b
llm = ChatOllama(model="gemma:2b")

# Optional: JSON parser
parser = JsonOutputParser()

# LangChain runnable pipeline
chain = prompt | llm | parser

def generate_flashcards_from_text(text: str) -> list[dict]:
    try:
        result = chain.invoke({"text": text[:4000]})
        if isinstance(result, list) and all("question" in item and "answer" in item for item in result):
            print(f"Result: {result}")
            return result
        else:
            print("Unexpected output format:", result)
            return []
    except Exception as e:
        print("Error:", e)
        return []

