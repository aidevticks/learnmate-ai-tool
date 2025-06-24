import re
import json
from langchain_core.prompts import PromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser

template = """
Generate 5 multiple-choice questions (MCQs) from the given text.
Each MCQ should be a dictionary with:
- 'question': the question string
- 'choices': four options like ["A,B,C,D"]
- 'correct_answer': Like "A", "B", "C", or "D"

Respond only with a valid JSON array of such MCQs.

Text:
{text}
"""

prompt = PromptTemplate.from_template(template)
llm = ChatOllama(model="gemma:2b")
parser = StrOutputParser()
chain = prompt | llm | parser

def generate_mcqs_from_text(text: str) -> list[dict]:
    try:
        response = chain.invoke({"text": text[:4000]})
        
        # Try direct JSON parsing
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON array using regex
            match = re.search(r'\[\s*{.*}\s*\]', response, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            print("No JSON array found.")
            return []
    except Exception as e:
        print("MCQ generation error:", e)
        return []
