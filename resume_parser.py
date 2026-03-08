import pdfplumber
from groq import Groq
import json
import re
import os
import sys
import logging
import argparse
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# Configure Groq
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    log.error("Missing GROQ_API_KEY!")
    log.error("1. Create a .env file in this folder")
    log.error("2. Add this line: GROQ_API_KEY=your_key_here")
    log.error("3. Get a free key at https://console.groq.com")
    sys.exit(1)

client = Groq(api_key=api_key)

def extract_text_from_pdf(pdf_path):
    """Extract raw text from a PDF file."""
    log.info(f"Reading PDF: {pdf_path}")
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        log.info(f"Total pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                chars = len(page_text)
                log.info(f"  Page {i+1}: extracted {chars} characters")
                text += page_text + "\n"
    log.info(f"Total text extracted: {len(text)} characters")
    return text.strip()


def parse_resume_with_Groq(resume_text):
    """Send resume text to Groq and get structured JSON back."""
    log.info("Sending to Groq for parsing...")

    prompt = f"""
You are a resume parser. Extract information from the resume below and return ONLY a valid JSON object.
Do not include any explanation, markdown, or backticks. Just raw JSON.

Return this exact structure:
{{
  "name": "",
  "email": "",
  "phone": "",
  "skills": [],
  "languages": [],
  "frameworks": [],
  "tools": [],
  "experience": [
    {{
      "role": "",
      "company": "",
      "duration": "",
      "responsibilities": []
    }}
  ],
  "education": [
    {{
      "degree": "",
      "institution": "",
      "year": "",
      "score": ""
    }}
  ],
  "projects": [
    {{
      "name": "",
      "tech_stack": [],
      "description": ""
    }}
  ],
  "summary": ""
}}

Resume:
{resume_text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.choices[0].message.content.strip()

    # Clean up in case Groq adds markdown backticks
    raw = re.sub(r"^```json", "", raw).strip()
    raw = re.sub(r"^```", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()

    parsed = json.loads(raw)
    return parsed


def parse_resume(pdf_path):
    """Main function: takes PDF path, returns structured resume data."""
    if not os.path.exists(pdf_path):
        log.error(f"File not found: {pdf_path}")
        sys.exit(1)

    # Step 1: Extract text
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text:
        log.error("Could not extract text. Make sure the PDF is not a scanned image.")
        sys.exit(1)

    # Step 2: Parse with Groq
    parsed_data = parse_resume_with_Groq(resume_text)
    log.info("Resume parsed successfully!")
    return parsed_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse a PDF resume using Groq AI")
    parser.add_argument("--resume", required=True, help="Path to the PDF resume")
    parser.add_argument("--output", help="Optional: path to save JSON output")
    args = parser.parse_args()

    result = parse_resume(args.resume)

    # Pretty print
    print("\n📊 Parsed Resume Data:")
    print(json.dumps(result, indent=2))

    # Save output
    output_path = args.output or args.resume.replace(".pdf", "_parsed.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    log.info(f"Saved to: {output_path}")