"""Quick smoke test for all 4 resume templates."""
import sys
sys.path.insert(0, ".")

from backend.resume_pdf_generator import build_resume_context, render_resume_html

opt = {
    "company": "Google",
    "role": "Software Engineer",
    "optimized_summary": "Experienced full-stack engineer with Python, React and Cloud expertise.",
    "optimized_skills": ["Python", "React", "FastAPI", "MongoDB", "Docker", "AWS"],
    "optimized_projects": [
        {
            "name": "IntelliCode AI",
            "optimized_description": "Built AI interview platform with Gemini AI and FastAPI.",
            "added_keywords": ["FastAPI", "React", "Gemini"],
        }
    ],
    "optimized_experience": [
        {
            "title": "Software Engineer | TCS | 2022-2024",
            "optimized_bullets": [
                "Led development of REST APIs using FastAPI serving 50k+ daily requests.",
                "Reduced deployment time by 40% via Docker + GitHub Actions CI/CD pipeline.",
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

ctx = build_resume_context(opt, parsed, "Arpita Vaid")

errors = []
for tmpl in ["faang", "classic", "minimal", "executive"]:
    try:
        html = render_resume_html(ctx, tmpl)
        assert "Arpita Vaid" in html, "Name missing"
        assert "Google" in html, "Company missing"
        assert "Python" in html, "Skills missing"
        assert len(html) > 1000, f"HTML too short: {len(html)}"
        print(f"  [PASS] {tmpl:12s}  {len(html):,} chars")
    except Exception as e:
        errors.append(f"{tmpl}: {e}")
        print(f"  [FAIL] {tmpl}: {e}")

if errors:
    print(f"\n{len(errors)} template(s) failed.")
    sys.exit(1)
else:
    print("\nAll 4 templates render correctly.")
