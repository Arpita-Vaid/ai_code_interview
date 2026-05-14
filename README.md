# AI Interview Preparation Orchestrator

The **AI Interview Preparation Orchestrator** is an AI-driven platform designed to unify the fragmented coding interview preparation experience. Rather than hosting proprietary problems, it curates and orchestrates study materials across multiple platforms into one seamless, adaptive journey.

## 🌟 Core Features

### 1. AI-Driven Personalised Roadmaps
*   **Dynamic Generation:** Utilizes advanced LLMs (such as GPT-4 or Google Gemini) to generate custom, multi-week study schedules based on your specific goals, timeline, and current skill level.
*   **Adaptive Calibration:** The AI mentor continuously monitors your progress and recalibrates the plan if you deviate or struggle with specific topics (e.g., adding more Dynamic Programming exercises if needed).

### 2. Comprehensive Task Planner & Scheduling
*   **Centralized Dashboard:** View curated tasks pulled from LeetCode, GeeksforGeeks (GFG), Kaggle, Coursera, and GitHub in an intuitive calendar or spreadsheet UI.
*   **Calendar Sync:** Easily synchronize your scheduled study tasks with Google Calendar to stay on track.

### 3. Seamless Integrations & Progress Sync
*   **Automated Tracking:** Automatically track your completed exercises across external sites without manual data entry.
*   **Multiple Integration Methods:** Syncs progress using official APIs (like the Kaggle CLI or GitHub Webhooks), browser extensions for platforms like GFG, web scrapers, or manual CSV uploads. 

### 4. Interactive AI Mentor & Mock Interviews
*   **Context-Aware Chat:** Ask the AI mentor to explain complex topics like dynamic programming in simple terms or request real-time hints.
*   **Simulated Q&A:** The AI conducts follow-up interview simulations based on your recently completed tasks (e.g., asking why you chose a specific data structure for a problem you just solved).

### 5. Embedded Coding Environment
*   **Monaco Editor Integration:** Practice coding directly within the platform using the Monaco Editor (the same technology behind VS Code) alongside problem statements and sample tests.
*   **Secure Execution:** Submit code to be compiled and run securely within a sandboxed Docker environment.

### 6. Real-Time Emotion Detection
*   **Confidence Analytics:** During mock interviews, the platform uses TensorFlow.js (via webcam) to analyze facial expressions and stress levels in real time.
*   **Behavioral Feedback:** The AI coach uses this data to provide unique feedback on your confidence and presentation, helping test-anxious learners overcome pressure.

### 7. Rich Analytics Dashboard
*   **Performance Tracking:** Visualize your learning outcomes through interactive charts (built with Recharts/Chart.js) detailing coding accuracy over time, weak-topic breakdowns, and interview confidence scores.

### 8. Secure Authentication Module
*   **User Profiles:** Create an account via standard email/password signup or Google OAuth.
*   **Robust Security:** The backend leverages Node/Express and MongoDB, securing sessions with JSON Web Tokens (JWT) stored in HTTP-only cookies and utilizing bcrypt for password hashing.

---

## 🛠 Tech Stack

*   **Frontend:** React (MERN Stack) with Monaco Editor and FullCalendar.
*   **Backend / API:** Node.js and Express for RESTful routing and authentication.
*   **Database:** MongoDB for flexible user schemas, alongside Redis (caching) and a Vector Database (Pinecone/RedisVector) for fast semantic search.
*   **AI/ML Microservices:** FastAPI Python backend interacting with LLMs (OpenAI/Gemini/Hugging Face) and client-side TensorFlow.js for vision models.
*   **Infrastructure:** Microservices containerized in Docker and orchestrated on Kubernetes.
