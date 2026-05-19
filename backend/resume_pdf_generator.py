"""
IntelliCode AI — ATS-Friendly Resume PDF Generator
Pure single-column layout: no tables, no graphics, plain text hierarchy.
ATS parsers can read every word. Looks polished to humans too.
"""

import re
from pathlib import Path
from datetime import datetime

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

OUTPUT_DIR = Path("uploads/optimized_resumes")

# ─── Templates ───────────────────────────────────────────────────────────────
TEMPLATES = {
    "faang":     {"accent": "#6C3AED", "name_color": "#1F2937"},
    "classic":   {"accent": "#1D4ED8", "name_color": "#0F172A"},
    "minimal":   {"accent": "#374151", "name_color": "#111827"},
    "executive": {"accent": "#065F46", "name_color": "#064E3B"},
}

# ─── Skill categories ────────────────────────────────────────────────────────
SKILL_CATEGORIES = {
    "Languages":      ["python","javascript","typescript","java","c++","c#","go","golang",
                       "rust","swift","kotlin","ruby","php","scala","dart","bash","sql"],
    "Frontend":       ["react","vue","angular","next.js","nextjs","nuxt","svelte","html","css",
                       "sass","tailwind","bootstrap","shadcn","redux","graphql","jquery","vite"],
    "Backend":        ["fastapi","django","flask","node.js","express","spring","laravel",
                       "nestjs","rest","microservices","grpc","kafka","nginx","fastify"],
    "Databases":      ["mongodb","postgresql","mysql","sqlite","redis","elasticsearch",
                       "dynamodb","cassandra","firebase","neo4j","oracle","prisma"],
    "AI / ML":        ["machine learning","deep learning","tensorflow","pytorch","keras",
                       "scikit-learn","nlp","computer vision","opencv","pandas","numpy",
                       "langchain","transformers","llm","mlops"],
    "Cloud & DevOps": ["aws","azure","gcp","google cloud","docker","kubernetes","terraform",
                       "jenkins","ci/cd","github actions","vercel","netlify","linux","git"],
    "Tools":          ["figma","postman","jira","swagger","prometheus","grafana","sentry","notion"],
}


def _is_url(text: str) -> bool:
    return bool(re.search(r'github\.com|linkedin\.com|http[s]?://', text, re.IGNORECASE))


def _preprocess_skills(skills: list) -> list:
    """Split compound skill strings like 'Python, C++, Java' into individual tokens."""
    prefix_re = re.compile(
        r'^(?:programming languages?|frameworks?|tools?|databases?|frontend|backend'
        r'|technologies|tech stack|languages?)\s*[:\-]\s*', re.IGNORECASE
    )
    seen, result = set(), []
    for raw in skills:
        if not isinstance(raw, str):
            continue
        raw = prefix_re.sub('', raw.strip())
        for token in re.split(r'[,/|]|(?:\s*:\s*)', raw):
            t = token.strip().strip('.')
            if t and 2 <= len(t) <= 40 and not _is_url(t):
                tl = t.lower()
                if tl not in seen:
                    seen.add(tl)
                    result.append(t)
    return result


def _categorize_skills(skills: list) -> dict:
    """Categorize skills using whole-word regex matching."""
    clean = _preprocess_skills(skills)
    result = {cat: [] for cat in SKILL_CATEGORIES}
    result["Other"] = []
    placed = set()
    for s in clean:
        sl = s.lower()
        matched = False
        for cat, keywords in SKILL_CATEGORIES.items():
            for kw in keywords:
                if len(kw) >= 2 and re.search(r'\b' + re.escape(kw) + r'\b', sl):
                    if sl not in placed:
                        result[cat].append(s)
                        placed.add(sl)
                    matched = True
                    break
            if matched:
                break
        if not matched and sl not in placed and len(sl) <= 35 and len(sl.split()) <= 3:
            result["Other"].append(s)
            placed.add(sl)
    return {k: v for k, v in result.items() if v}


def _split_bullets(text: str) -> list:
    """Split description into clean bullet points."""
    if not text:
        return []
    if re.search(r'[–•►●]', text):
        parts = re.split(r'\s*[–•►●]\s*', text)
    elif text.count('. ') >= 2:
        parts = re.split(r'\.\s+(?=[A-Z])', text)
    else:
        parts = [text]
    return [p.strip().rstrip('.') for p in parts if p.strip() and len(p.strip()) > 12]


def _clean_project_name(name: str) -> str:
    return re.split(r'\s*[|–]\s*', name)[0].strip()


def _extract_contact(raw_text: str) -> list:
    parts = []
    e = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
    p = re.search(r'(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}', raw_text)
    g = re.search(r'github\.com/[A-Za-z0-9._\-]+', raw_text, re.IGNORECASE)
    li = re.search(r'linkedin\.com/in/[A-Za-z0-9._\-]+', raw_text, re.IGNORECASE)
    if e:  parts.append(e.group())
    if p:  parts.append(p.group().strip())
    if g:  parts.append(g.group())
    if li: parts.append(li.group())
    return parts


def _ensure_dir():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── Main ─────────────────────────────────────────────────────────────────────

def generate_optimized_pdf(
    optimization_data: dict,
    original_parsed: dict,
    user_name: str = "Candidate",
    template: str = "faang",
) -> str:
    if not HAS_REPORTLAB:
        raise RuntimeError("reportlab not installed: pip install reportlab")
    _ensure_dir()

    tmpl = TEMPLATES.get(template, TEMPLATES["faang"])
    company  = optimization_data.get("company", "Company")
    role     = optimization_data.get("role", "Software Engineer")
    ts       = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filepath = OUTPUT_DIR / f"resume_{company.lower().replace(' ','_')}_{template}_{ts}.pdf"

    acc = HexColor(tmpl["accent"])
    nc  = HexColor(tmpl["name_color"])
    DARK  = HexColor("#1F2937")
    MUTED = HexColor("#6B7280")
    RULE  = HexColor("#E5E7EB")

    doc = SimpleDocTemplate(
        str(filepath), pagesize=A4,
        leftMargin=2.0*cm, rightMargin=2.0*cm,
        topMargin=1.8*cm, bottomMargin=2.0*cm,
        title=f"{user_name} — {role}",
        author=user_name,
        subject=f"Optimized for {company}",
    )

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    name_s    = S("N",  fontSize=22, fontName="Helvetica-Bold",  textColor=nc,   spaceAfter=2,  leading=26)
    role_s    = S("R",  fontSize=10, fontName="Helvetica",       textColor=MUTED,spaceAfter=1,  leading=13)
    contact_s = S("C",  fontSize=8.5,fontName="Helvetica",       textColor=MUTED,spaceAfter=4,  leading=12, alignment=TA_CENTER)
    sec_s     = S("SH", fontSize=10, fontName="Helvetica-Bold",  textColor=acc,  spaceBefore=10,spaceAfter=2, leading=13)
    body_s    = S("B",  fontSize=9.5,fontName="Helvetica",       textColor=DARK, spaceAfter=2,  leading=14, alignment=TA_JUSTIFY)
    bul_s     = S("BL", fontSize=9.5,fontName="Helvetica",       textColor=DARK, spaceAfter=2,  leading=14, leftIndent=14, firstLineIndent=-6)
    job_s     = S("JB", fontSize=10, fontName="Helvetica-Bold",  textColor=DARK, spaceAfter=0,  leading=13)
    meta_s    = S("MT", fontSize=8.5,fontName="Helvetica",       textColor=MUTED,spaceAfter=2,  leading=12)
    cat_s     = S("CK", fontSize=9.5,fontName="Helvetica-Bold",  textColor=DARK, spaceAfter=1,  leading=13)
    proj_s    = S("PR", fontSize=10, fontName="Helvetica-Bold",  textColor=DARK, spaceAfter=1,  leading=13)
    tech_s    = S("TK", fontSize=8.5,fontName="Helvetica-Oblique",textColor=MUTED,spaceAfter=2, leading=12)
    deg_s     = S("DG", fontSize=10, fontName="Helvetica-Bold",  textColor=DARK, spaceAfter=1,  leading=13)
    foot_s    = S("FT", fontSize=7.5,fontName="Helvetica",       textColor=MUTED,spaceAfter=0,  alignment=TA_CENTER)

    def rule(thick=0.8, color=None, before=0, after=4):
        return HRFlowable(width="100%", thickness=thick,
                          color=color or acc, spaceBefore=before, spaceAfter=after)

    def thin_rule():
        return HRFlowable(width="100%", thickness=0.4, color=RULE, spaceBefore=2, spaceAfter=4)

    def section(title):
        return [Paragraph(title.upper(), sec_s), rule(thick=1.2, before=0, after=5)]

    story = []

    # ── HEADER ──────────────────────────────────────────────────────────────
    story.append(Paragraph(user_name, name_s))
    story.append(Paragraph(role, role_s))
    contacts = _extract_contact(original_parsed.get("raw_text", ""))
    if contacts:
        story.append(Paragraph("  |  ".join(contacts), contact_s))
    story.append(rule(thick=2.0, before=4, after=8))

    # ── SUMMARY ──────────────────────────────────────────────────────────────
    summary = optimization_data.get("optimized_summary", "")
    if summary:
        story.extend(section("Professional Summary"))
        story.append(Paragraph(summary, body_s))
        story.append(Spacer(1, 4))

    # ── SKILLS ───────────────────────────────────────────────────────────────
    opt_skills = optimization_data.get("optimized_skills", [])
    if opt_skills:
        categorized = _categorize_skills(opt_skills)
        if categorized:
            story.extend(section("Technical Skills"))
            for cat, items in categorized.items():
                # "Languages:  Python,  TypeScript,  Java"
                line = f"<b>{cat}:</b>  {',  '.join(items)}"
                story.append(Paragraph(line, body_s))
            story.append(Spacer(1, 4))

    # ── EXPERIENCE ───────────────────────────────────────────────────────────
    opt_exp = optimization_data.get("optimized_experience", [])
    if not opt_exp:
        raw_exp = original_parsed.get("experience", [])
        opt_exp = [{"title": e.get("title",""), "optimized_bullets": e.get("details",[])}
                   for e in raw_exp if e.get("title","")]

    if opt_exp:
        story.extend(section("Work Experience"))
        for exp in opt_exp:
            raw_title = exp.get("title", "")
            if not raw_title:
                continue
            parts = re.split(r'\s*[|·,]\s*', raw_title, maxsplit=2)
            job    = parts[0].strip()
            co     = parts[1].strip() if len(parts) > 1 else ""
            dates  = parts[2].strip() if len(parts) > 2 else ""
            bullets = exp.get("optimized_bullets") or exp.get("original_bullets", [])
            bullets = [b for b in bullets if b and len(b) > 5 and not _is_url(b)]

            block = [Paragraph(job, job_s)]
            if co or dates:
                meta = "  |  ".join(x for x in [co, dates] if x)
                block.append(Paragraph(meta, meta_s))
            for b in bullets[:6]:
                block.append(Paragraph(f"\u2022  {b}", bul_s))
            block.append(Spacer(1, 5))
            story.append(KeepTogether(block))

    # ── PROJECTS ─────────────────────────────────────────────────────────────
    opt_proj = optimization_data.get("optimized_projects", [])
    if opt_proj:
        story.extend(section("Projects"))
        for proj in opt_proj:
            name = proj.get("name", "")
            desc = proj.get("optimized_description") or proj.get("original_description", "")
            kws  = proj.get("added_keywords", [])
            if _is_url(name):
                continue
            clean = _clean_project_name(name)
            if not clean:
                continue
            bullets = _split_bullets(desc)
            bullets = [b for b in bullets if not _is_url(b) and len(b) > 10]

            block = [Paragraph(clean, proj_s)]
            if kws:
                block.append(Paragraph(f"Stack:  {' | '.join(kws[:6])}", tech_s))
            for b in bullets[:5]:
                block.append(Paragraph(f"\u2022  {b}", bul_s))
            if not bullets and desc and len(desc) > 20:
                block.append(Paragraph(f"\u2022  {desc[:200]}", bul_s))
            block.append(Spacer(1, 5))
            story.append(KeepTogether(block))

    # ── EDUCATION ────────────────────────────────────────────────────────────
    education = original_parsed.get("education", [])
    if education:
        story.extend(section("Education"))
        for edu in education:
            degree = edu.get("degree", "")
            inst   = edu.get("institution", "")
            year   = edu.get("year", "")
            if not degree:
                continue
            # Strip embedded date ranges from degree string
            degree_clean = re.split(r'\s+(?:Aug|Sep|Jan|Feb|Mar|Apr|May|Jun|Jul|Oct|Nov|Dec|\d{4})', degree)[0].strip().rstrip('–-').strip()
            block = [Paragraph(degree_clean or degree[:80], deg_s)]
            parts = [p for p in [inst, year] if p]
            if parts:
                block.append(Paragraph("  |  ".join(parts), meta_s))
            block.append(Spacer(1, 4))
            story.append(KeepTogether(block))

    # ── CERTIFICATIONS ───────────────────────────────────────────────────────
    certs = original_parsed.get("certifications", [])
    if certs:
        story.extend(section("Certifications"))
        for cert in certs:
            story.append(Paragraph(f"\u2022  {cert}", bul_s))
        story.append(Spacer(1, 4))

    # ── FOOTER ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(thin_rule())
    story.append(Paragraph(
        f"<i>Optimized for {company} — {role}  |  IntelliCode AI  |  {datetime.utcnow().strftime('%B %Y')}</i>",
        foot_s
    ))

    doc.build(story)
    return str(filepath.resolve())
