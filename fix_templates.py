import re

for fname in ['classic', 'minimal', 'executive']:
    path = f'd:/arpita repos/ai_code_interview/backend/resume_templates/{fname}.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    # Remove all ::before rules
    html = re.sub(r'\s*\.[a-z\-]+::before\s*\{[^}]+\}', '', html)
    # Add inline bullet chars into loops
    old = '{{ b }}</div>'
    new = '&#9658;&nbsp;{{ b }}</div>'
    html = html.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'{fname}: OK')
