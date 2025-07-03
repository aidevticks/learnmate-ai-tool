import re
import json
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# Define the MCQ generation prompt
template = """
Generate 5 multiple-choice questions (MCQs) from the given text.
Each MCQ should be a dictionary with:
- 'question': the question string
- 'choices': four options like ["A", "B", "C", "D"]
- 'correct_answer': one of "A", "B", "C", or "D"

Respond only with a valid JSON array of such MCQs.

Text:
{text}
"""

# Create the prompt template
prompt = PromptTemplate.from_template(template)

# Use OpenAI Chat model
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.2)

# Simple string output parser
parser = StrOutputParser()

# Compose chain
chain = prompt | llm | parser

# MCQ generation function
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
            print("No valid JSON array found in response.")
            return []
    except Exception as e:
        print("MCQ generation error:", e)
        return []
