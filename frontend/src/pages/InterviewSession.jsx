import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { key:'all', icon:'⚡', label:'Mixed' }, { key:'dsa', icon:'🌳', label:'DSA' },
  { key:'system_design', icon:'🏗️', label:'System Design' }, { key:'behavioral', icon:'🤝', label:'Behavioral' },
  { key:'javascript', icon:'🟡', label:'JavaScript' }, { key:'python', icon:'🐍', label:'Python' },
  { key:'sql', icon:'🗄️', label:'SQL' },
];

export default function InterviewSession() {
  const [phase, setPhase] = useState('setup'); // setup | interview | finished
  const [cat, setCat] = useState('all');
  const [diff, setDiff] = useState('all');
  const [numQ, setNumQ] = useState(5);
  const [session, setSession] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const nav = useNavigate();

  // Timer
  useEffect(() => {
    if (phase !== 'interview') return;
    timerRef.current = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx]);

  const startSession = async () => {
    const res = await authFetch('/interview/sessions', { method: 'POST', body: JSON.stringify({ category: cat, difficulty: diff, num_questions: numQ }) });
    if (!res.ok) { alert('Failed to start'); return; }
    const data = await res.json();
    setSession(data); setPhase('interview'); setQIdx(0); setTimer(120); startTimeRef.current = Date.now();
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true); clearInterval(timerRef.current);
    const q = session.questions[qIdx];
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const res = await authFetch(`/interview/sessions/${session.session_id}/answer`, { method: 'POST', body: JSON.stringify({ question_id: q.id, user_answer: answer, time_taken: timeTaken }) });
    const data = await res.json();
    setFeedback(data);
    setAnswers(prev => [...prev, { q: q.text, score: data.ai_score, feedback: data.ai_feedback }]);
    setSubmitting(false);
  };

  const nextQuestion = () => {
    if (qIdx >= session.questions.length - 1) { finishSession(); return; }
    setQIdx(i => i + 1); setAnswer(''); setFeedback(null); setTimer(120); startTimeRef.current = Date.now();
  };

  const finishSession = async () => {
    await authFetch(`/interview/sessions/${session.session_id}/finish`, { method: 'POST' });
    setPhase('finished');
  };

  const avgScore = answers.length ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length * 10) / 10 : 0;
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');

  return (
    <>
      <Navbar />
      <div className="page-body">
        {phase === 'setup' && (
          <div className="setup-panel">
            <h1>Start an <span className="text-accent">Interview</span></h1>
            <p className="text-muted" style={{marginBottom:24}}>Choose a topic and difficulty, then answer AI-evaluated questions.</p>
            <div className="chart-card" style={{marginBottom:20}}>
              <h3 className="chart-title">📚 Category</h3>
              <div className="cat-grid">
                {CATEGORIES.map(c => <button key={c.key} className={`cat-btn ${cat===c.key?'active':''}`} onClick={()=>setCat(c.key)}><span>{c.icon}</span>{c.label}</button>)}
              </div>
              <h3 className="chart-title" style={{marginTop:16}}>⚖️ Difficulty</h3>
              <div className="diff-selector">
                {['all','easy','medium','hard'].map(d => <button key={d} className={`diff-btn ${diff===d?'active':''}`} onClick={()=>setDiff(d)}>{d==='all'?'Mixed':d}</button>)}
              </div>
              <h3 className="chart-title" style={{marginTop:16}}>🔢 Questions: {numQ}</h3>
              <input type="range" min={3} max={10} value={numQ} onChange={e=>setNumQ(+e.target.value)} style={{width:'100%',accentColor:'var(--accent)'}} />
            </div>
            <button className="btn btn-primary" onClick={startSession} style={{maxWidth:280}}>🚀 Start Interview</button>
          </div>
        )}

        {phase === 'interview' && session && (
          <div className="interview-active">
            <div className="session-bar">
              <div className="progress-bar"><div className="progress-fill" style={{width:`${((qIdx+(feedback?1:0))/session.questions.length)*100}%`}} /></div>
              <span className="progress-label">{qIdx+1}/{session.questions.length}</span>
              <div className={`timer-badge ${timer<=20?'urgent':''}`}>⏱ {mm}:{ss}</div>
            </div>
            <div className="question-card">
              <div className="q-meta">
                <span className="q-number">Q{qIdx+1} of {session.questions.length}</span>
                <span className={`diff-pill diff-${session.questions[qIdx].difficulty}`}>{session.questions[qIdx].difficulty}</span>
              </div>
              <p className="q-text">{session.questions[qIdx].text}</p>
              <textarea className="answer-area" value={answer} onChange={e=>setAnswer(e.target.value)} disabled={!!feedback} placeholder="Type your answer here…" rows={5} />
              <div className="session-actions">
                {!feedback ? (
                  <button className="btn btn-primary" onClick={submitAnswer} disabled={submitting}>{submitting ? '⏳ Submitting…' : '✅ Submit'}</button>
                ) : (
                  <button className="btn btn-primary" onClick={nextQuestion}>{qIdx >= session.questions.length-1 ? '🏁 Finish' : 'Next →'}</button>
                )}
              </div>
            </div>
            {feedback && (
              <div className={`feedback-card show ${feedback.ai_score<45?'low-score':feedback.ai_score<70?'mid-score':''}`}>
                <div className="feedback-score-row"><div className="big-score">{feedback.ai_score}</div><span className="text-muted">/ 100</span></div>
                <p>{feedback.ai_feedback}</p>
              </div>
            )}
          </div>
        )}

        {phase === 'finished' && (
          <div className="result-panel">
            <h1>🎉 Interview Complete!</h1>
            <div className="final-score-ring"><div className="final-score-num">{avgScore}</div><div className="text-muted">avg score</div></div>
            <div className="answers-list">
              {answers.map((a, i) => (
                <div key={i} className="answer-row">
                  <span>{i+1}. {a.q.substring(0, 60)}…</span>
                  <span className={`score-pill ${a.score>=70?'score-high':a.score>=45?'score-mid':'score-low'}`}>{a.score}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:12,marginTop:20}}>
              <button className="btn btn-primary" onClick={()=>nav('/dashboard')}>📊 Dashboard</button>
              <button className="btn btn-outline" onClick={()=>window.location.reload()}>🔄 New Session</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
