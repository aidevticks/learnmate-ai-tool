from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
import os

# Optional: Set your API key (if not already set in the environment)
# os.environ["OPENAI_API_KEY"] = "your-api-key"

# Initialize OpenAI Chat Model
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)

# Define prompt template
NOTES_PROMPT = PromptTemplate(
    input_variables=["text"],
    template=(
        "You are an intelligent AI assistant. Read the following study material and "
        "generate well-organized, concise, and informative notes highlighting key points:\n\n{text}"
    )
)

# Create LangChain chain
notes_chain = LLMChain(llm=llm, prompt=NOTES_PROMPT)

def generate_notes_from_text(text: str) -> str:
    try:
        return notes_chain.run({"text": text})
    except Exception as e:
        print("Error generating notes:", e)
        return ""
