"""Test xhtml2pdf PDF generation for all 4 templates."""
import sys
import os
sys.path.insert(0, ".")

from backend.resume_pdf_generator import build_resume_context, generate_optimized_pdf

opt = {
    "company": "Google",
    "role": "Software Engineer",
    "optimized_summary": "Experienced full-stack engineer with Python, React and Cloud expertise.",
    "optimized_skills": ["Python", "React", "FastAPI", "MongoDB", "Docker", "AWS", "TypeScript"],
    "optimized_projects": [
        {
            "name": "IntelliCode AI",
            "optimized_description": "Built AI interview platform with Gemini AI and FastAPI. Scaled to 10k users.",
            "added_keywords": ["FastAPI", "React", "Gemini", "MongoDB"],
        }
    ],
    "optimized_experience": [
        {
            "title": "Software Engineer | TCS | 2022-2024",
            "optimized_bullets": [
                "Led development of REST APIs using FastAPI serving 50k+ daily requests.",
                "Reduced deployment time by 40% via Docker and GitHub Actions CI/CD pipeline.",
                "Designed MongoDB schema for 3 microservices handling 1M+ records.",
            ],
        }
    ],
}
parsed = {
    "raw_text": "test@example.com +91-9876543210 github.com/arpita linkedin.com/in/arpitavaid",
    "education": [
        {"degree": "B.Tech Computer Science", "institution": "IIT Delhi", "year": "2023"}
    ],
    "certifications": ["AWS Solutions Architect", "Google Cloud Professional"],
    "experience": [],
}

errors = []
for tmpl in ["faang", "classic", "minimal", "executive"]:
    try:
        path = generate_optimized_pdf(opt, parsed, user_name="Arpita Vaid", template=tmpl)
        size = os.path.getsize(path)
        assert size > 3000, f"PDF too small: {size} bytes"
        print(f"  [PASS] {tmpl:12s}  {size:,} bytes  ->  {os.path.basename(path)}")
    except Exception as e:
        errors.append(f"{tmpl}: {e}")
        print(f"  [FAIL] {tmpl}: {e}")

if errors:
    print(f"\n{len(errors)} PDF(s) failed.")
    sys.exit(1)
else:
    print("\nAll 4 PDFs generated successfully.")
