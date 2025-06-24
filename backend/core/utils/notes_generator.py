from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain.chains import LLMChain

# Initialize Ollama model
llm = Ollama(model="gemma:2b")

# Define prompt template
NOTES_PROMPT = PromptTemplate(
    input_variables=["text"],
    template=(
        "You are an intelligent AI assistant. Read the following study material and "
        "generate well-organized, concise, and informative notes highlighting key points:\n\n{text}"
    )
)

# Create Langchain chain
notes_chain = LLMChain(llm=llm, prompt=NOTES_PROMPT)

def generate_notes_from_text(text):
    return notes_chain.run({"text": text})