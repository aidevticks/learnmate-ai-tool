# utils/pdf_text_extractor.py
import fitz
import pdfplumber
import re

def extract_text_from_pdf(file_path, method='pdfplumber'):
    """
    Extracts clean text from a PDF file.
    
    Args:
        file_path (str): Path to the PDF file.
        method (str): Extraction method ('pdfplumber' or 'pymupdf').

    Returns:
        str: Cleaned extracted text.
    """
    text = ""

    if method == 'pdfplumber':
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    elif method == 'pymupdf':
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()

    # Optional: Clean headers, footers, extra whitespace
    text = _clean_extracted_text(text)

    return text.strip()


def _clean_extracted_text(text):
    """
    Cleans the extracted PDF text for better LLM input.

    - Removes repeating headers/footers
    - Normalizes whitespace
    - Removes empty lines

    Args:
        text (str): Raw extracted text.

    Returns:
        str: Cleaned text.
    """
    # Remove multiple spaces and normalize line breaks
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)

    # Optional: Remove header/footer patterns if known
    # Example:
    # text = re.sub(r'Page \d+ of \d+', '', text)

    return text.strip()
