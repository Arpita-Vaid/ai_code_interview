"""AI Interview Engine — OpenAI-powered question generation and answer scoring."""

import os
import json
import random

# Try to import openai; if not installed, use fallback mode
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")

# ─── Fallback Questions (when OpenAI is not available) ────────────────────────

FALLBACK_QUESTIONS = {
    "hr": [
        "Tell me about yourself and your professional background.",
        "Why are you interested in this role?",
        "What are your greatest strengths and weaknesses?",
        "Where do you see yourself in 5 years?",
        "Describe a time you handled conflict at work.",
        "What motivates you professionally?",
        "How do you handle pressure and tight deadlines?",
        "Why are you leaving your current position?",
        "What salary range are you expecting?",
        "Do you have any questions for us?",
    ],
    "technical": [
        "Explain the difference between a stack and a queue.",
        "What is the time complexity of binary search?",
        "Explain how RESTful APIs work.",
        "What is the difference between SQL and NoSQL databases?",
        "Explain the concept of microservices architecture.",
        "What is the difference between TCP and UDP?",
        "Explain how garbage collection works.",
        "What is the CAP theorem?",
        "Describe the SOLID principles in software design.",
        "What is the difference between horizontal and vertical scaling?",
    ],
    "behavioral": [
        "Tell me about a time you led a team through a difficult project.",
        "Describe a situation where you had to learn something quickly.",
        "Give an example of a time you failed and what you learned.",
        "Tell me about a time you disagreed with your manager.",
        "Describe how you prioritize tasks when everything is urgent.",
        "Give an example of a creative solution you proposed.",
        "Tell me about a time you went above and beyond.",
        "Describe a situation where you had to adapt to change quickly.",
        "How do you handle receiving critical feedback?",
        "Tell me about your most challenging project and how you managed it.",
    ],
}

SYSTEM_PROMPTS = {
    "hr": """You are an experienced HR interviewer conducting a professional job interview.
Ask relevant HR questions, assess communication skills, cultural fit, and career goals.
Be professional but warm. Ask follow-up questions based on answers.""",

    "technical": """You are a senior technical interviewer assessing a candidate's technical knowledge.
Ask questions about data structures, algorithms, system design, databases, and programming concepts.
Probe deeper based on answers. Be fair but thorough.""",

    "behavioral": """You are a behavioral interview specialist using the STAR method.
Ask about past experiences: Situation, Task, Action, Result.
Assess leadership, problem-solving, teamwork, and adaptability.
Ask follow-up questions to get specific examples.""",
}


def get_client():
    """Get OpenAI client if configured."""
    if HAS_OPENAI and OPENAI_KEY and not OPENAI_KEY.startswith("sk-your"):
        return OpenAI(api_key=OPENAI_KEY)
    return None


async def generate_question(round_type: str, conversation_history: list[dict], question_num: int) -> dict:
    """Generate an interview question using OpenAI or fallback."""
    client = get_client()

    if client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(round_type, SYSTEM_PROMPTS["hr"])}]
            messages.extend(conversation_history)

            if question_num == 1:
                messages.append({"role": "user", "content": "Please start the interview with your first question."})
            else:
                messages.append({"role": "user", "content": "Please ask the next interview question based on the conversation so far."})

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=300,
                temperature=0.7,
            )
            return {
                "question": response.choices[0].message.content.strip(),
                "source": "openai",
            }
        except Exception as e:
            pass  # Fall through to fallback

    # Fallback: use pre-built questions
    questions = FALLBACK_QUESTIONS.get(round_type, FALLBACK_QUESTIONS["hr"])
    idx = min(question_num - 1, len(questions) - 1)
    return {
        "question": questions[idx],
        "source": "fallback",
    }


async def score_answer(round_type: str, question: str, answer: str, conversation_history: list[dict]) -> dict:
    """Score an answer using OpenAI or keyword-based fallback."""
    client = get_client()

    if client:
        try:
            scoring_prompt = f"""You are evaluating a candidate's answer in a {round_type} interview.

Question: {question}
Answer: {answer}

Rate the answer on a scale of 0-100 and provide brief feedback.
Respond in JSON format: {{"score": <number>, "feedback": "<string>", "strengths": ["<str>"], "improvements": ["<str>"]}}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": "You are an interview evaluator. Always respond with valid JSON."}, {"role": "user", "content": scoring_prompt}],
                max_tokens=300,
                temperature=0.3,
            )
            text = response.choices[0].message.content.strip()
            # Try to parse JSON from response
            if "{" in text:
                text = text[text.index("{"):text.rindex("}") + 1]
            result = json.loads(text)
            result["source"] = "openai"
            return result
        except Exception:
            pass

    # Fallback scoring
    return _fallback_score(answer, round_type)


def _fallback_score(answer: str, round_type: str) -> dict:
    """Simple keyword-based scoring fallback."""
    words = answer.lower().split()
    word_count = len(words)
    score = 30  # base

    # Length bonus
    if word_count > 20: score += 10
    if word_count > 50: score += 10
    if word_count > 100: score += 10

    # Keywords
    good_keywords = {
        "hr": ["team", "leadership", "growth", "passionate", "collaborative", "goal", "experience", "skills"],
        "technical": ["algorithm", "complexity", "database", "api", "architecture", "scalable", "performance", "design"],
        "behavioral": ["situation", "task", "action", "result", "learned", "improved", "challenge", "outcome"],
    }

    keywords = good_keywords.get(round_type, good_keywords["hr"])
    matches = sum(1 for kw in keywords if kw in answer.lower())
    score += matches * 5
    score = min(score, 95)

    if word_count < 10:
        feedback = "Your answer is too brief. Try to provide more detail and examples."
        strengths = []
        improvements = ["Provide more detailed responses", "Include specific examples"]
    elif score >= 70:
        feedback = "Good answer with relevant details. Consider adding more concrete examples."
        strengths = ["Relevant content", "Good detail level"]
        improvements = ["Add more specific examples"]
    else:
        feedback = "Try to structure your answer better. Use the STAR method for behavioral questions."
        strengths = ["Attempted to answer"]
        improvements = ["More structure", "Include specific examples", "Use relevant terminology"]

    return {"score": score, "feedback": feedback, "strengths": strengths, "improvements": improvements, "source": "fallback"}
