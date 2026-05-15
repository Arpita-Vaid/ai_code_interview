import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const ROUND_META = {
  hr: { icon: '🤝', title: 'HR Interview', color: 'text-purple-400' },
  technical: { icon: '⚙️', title: 'Technical Interview', color: 'text-blue-400' },
  behavioral: { icon: '🧠', title: 'Behavioral Interview', color: 'text-pink-400' },
};

export default function AIInterviewRoom() {
  const { roundType } = useParams();
  const [searchParams] = useSearchParams();
  const maxQ = parseInt(searchParams.get('questions') || '5');
  const nav = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [qNum, setQNum] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const chatRef = useRef(null);
  const recogRef = useRef(null);
  const timerRef = useRef(null);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  // TTS: speak text
  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [ttsEnabled]);

  // STT: speech recognition
  const toggleMic = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';
    let finalText = input;
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setInput(finalText + interim);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const startSession = async () => {
    setLoading(true);
    const res = await authFetch('/ai-interview/start', {
      method: 'POST', body: JSON.stringify({ round_type: roundType }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setQNum(1);
    setMessages([{ role: 'ai', content: data.question, qNum: 1 }]);
    setLoading(false);
    speak(data.question);
  };

  const submitAnswer = async () => {
    if (!input.trim() || loading) return;
    if (listening) { recogRef.current?.stop(); setListening(false); }
    window.speechSynthesis?.cancel();

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const res = await authFetch('/ai-interview/respond', {
      method: 'POST', body: JSON.stringify({ session_id: sessionId, answer: userMsg.content }),
    });
    const data = await res.json();

    // Add feedback
    setMessages(prev => [...prev, {
      role: 'feedback', score: data.score, feedback: data.feedback,
      strengths: data.strengths, improvements: data.improvements,
    }]);

    if (qNum >= maxQ) {
      // End interview
      const endRes = await authFetch('/ai-interview/end', {
        method: 'POST', body: JSON.stringify({ session_id: sessionId }),
      });
      setResults(await endRes.json());
      setFinished(true);
      clearInterval(timerRef.current);
    } else {
      // Next question
      setQNum(q => q + 1);
      setMessages(prev => [...prev, { role: 'ai', content: data.next_question, qNum: qNum + 1 }]);
      speak(data.next_question);
    }
    setLoading(false);
  };

  const meta = ROUND_META[roundType] || ROUND_META.hr;
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');

  if (finished && results) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">
          <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
          <div className="text-center animate-bounce-in mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-extrabold mb-2">Interview Complete!</h1>
            <p className="text-gray-400">{meta.title} • {results.total_questions} questions • {mm}:{ss}</p>
          </div>
          <div className="glass-card p-8 text-center mb-6 animate-slide-up">
            <div className="w-28 h-28 rounded-full border-4 border-[var(--color-accent)] bg-[var(--color-accent-glow)] flex flex-col items-center justify-center mx-auto mb-4">
              <div className="text-3xl font-extrabold">{results.avg_score}</div>
              <div className="text-xs text-gray-400">avg score</div>
            </div>
          </div>
          <div className="space-y-3 mb-8">
            {results.answers?.map((a, i) => (
              <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i*0.1}s` }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-400">Q{i+1}: {a.question?.substring(0, 60)}…</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.score >= 70 ? 'score-high' : a.score >= 45 ? 'score-mid' : 'score-low'}`}>{a.score}/100</span>
                </div>
                <p className="text-sm text-gray-300">{a.feedback}</p>
                {a.strengths?.length > 0 && <div className="mt-2 flex gap-1 flex-wrap">{a.strengths.map((s,j)=><span key={j} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">✓ {s}</span>)}</div>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => nav('/dashboard')} className="btn-gradient flex-1 py-3 rounded-xl font-bold">📊 Dashboard</button>
            <button onClick={() => nav('/ai-interview')} className="flex-1 py-3 rounded-xl font-bold border border-gray-700 text-gray-300 hover:border-[var(--color-accent)] transition-colors">🔄 New Interview</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col h-[calc(100vh-56px)] relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-xl">{meta.icon}</span>
            <span className={`font-bold ${meta.color}`}>{meta.title}</span>
            <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5">Q{qNum}/{maxQ}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${ttsEnabled ? 'border-[var(--color-accent)] text-[var(--color-accent-light)]' : 'border-gray-700 text-gray-500'}`}>
              {ttsEnabled ? '🔊 TTS On' : '🔇 TTS Off'}
            </button>
            <div className={`font-mono text-sm px-3 py-1 rounded-full border ${timer > 2700 ? 'border-red-500 text-red-400 timer-urgent' : 'border-gray-700 text-gray-400'}`}>
              ⏱ {mm}:{ss}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((m, i) => {
            if (m.role === 'ai') return (
              <div key={i} className="flex gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm shrink-0">AI</div>
                <div className="chat-bubble-ai px-4 py-3 max-w-[75%]">
                  <div className="text-xs text-gray-500 mb-1">Question {m.qNum}</div>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                  {speaking && i === messages.length - 1 && <div className="voice-wave mt-2"><span/><span/><span/><span/><span/></div>}
                </div>
              </div>
            );
            if (m.role === 'user') return (
              <div key={i} className="flex gap-3 justify-end animate-slide-up">
                <div className="chat-bubble-user px-4 py-3 max-w-[75%]">
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-sm shrink-0">You</div>
              </div>
            );
            if (m.role === 'feedback') return (
              <div key={i} className="mx-12 glass-card p-4 animate-slide-up">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-extrabold ${m.score >= 70 ? 'text-green-400' : m.score >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>{m.score}</span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{m.feedback}</p>
                <div className="flex flex-wrap gap-1">
                  {m.strengths?.map((s,j) => <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">✓ {s}</span>)}
                  {m.improvements?.map((s,j) => <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">↑ {s}</span>)}
                </div>
              </div>
            );
            return null;
          })}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm">AI</div>
              <div className="chat-bubble-ai px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay:'300ms'}}/></div></div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/40 backdrop-blur">
          <div className="flex gap-3 items-end max-w-3xl mx-auto">
            <button
              onClick={toggleMic}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${listening ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500 animate-pulse' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {listening ? '⏹' : '🎙️'}
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              placeholder={listening ? 'Listening… speak your answer' : 'Type your answer or click 🎙️ to speak…'}
              rows={2}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[var(--color-accent)] transition-colors"
            />
            <button
              onClick={submitAnswer}
              disabled={!input.trim() || loading}
              className="btn-gradient shrink-0 px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
            >
              Send ↵
            </button>
          </div>
          {listening && <div className="text-center mt-2 text-xs text-red-400">🔴 Recording… click ⏹ when done</div>}
        </div>
      </div>
    </>
  );
}
