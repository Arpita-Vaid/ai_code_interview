import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { authFetch } from '../api';

export default function CodingSession() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [lang, setLang] = useState('python');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const editorRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    authFetch(`/coding/problems/${id}`).then(r => r.json()).then(setProblem);
    timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [id]);

  const getCode = () => editorRef.current?.getValue() || '';
  const starterCode = problem ? (lang === 'python' ? problem.starter_python : problem.starter_js) : '';

  const runCode = async () => {
    setRunning(true);
    const res = await authFetch('/coding/run', { method: 'POST', body: JSON.stringify({ problem_id: +id, language: lang, code: getCode() }) });
    setResults(await res.json()); setRunning(false);
  };

  const submitCode = async () => {
    setRunning(true);
    const res = await authFetch('/coding/submit', { method: 'POST', body: JSON.stringify({ problem_id: +id, language: lang, code: getCode() }) });
    setResults(await res.json()); setRunning(false);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  if (!problem) return <div className="page-loader"><div className="loader-spinner" /><span>Loading…</span></div>;

  return (
    <div className="coding-layout">
      {/* Top bar */}
      <div className="coding-topbar">
        <a href="/coding" className="back-link">←</a>
        <div className="topbar-title">{problem.title} <span className={`diff-pill diff-${problem.difficulty}`}>{problem.difficulty}</span></div>
        <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
          <option value="python">🐍 Python</option>
          <option value="javascript">🟡 JavaScript</option>
        </select>
        <div className={`timer-badge ${elapsed>2700?'urgent':''}`}>{mm}:{ss}</div>
        <button className="btn btn-outline btn-sm" onClick={() => editorRef.current?.setValue(starterCode)}>↺ Reset</button>
        <button className="btn btn-outline btn-sm run-btn" onClick={runCode} disabled={running}>▶ Run</button>
        <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={running}>Submit</button>
      </div>

      {/* Problem panel */}
      <div className="problem-panel">
        <h2>{problem.title}</h2>
        <div className="prob-meta"><span className={`diff-pill diff-${problem.difficulty}`}>{problem.difficulty}</span>{(problem.tags||[]).map(t=><span key={t} className="pc-tag">{t}</span>)}</div>
        <div className="prob-desc">{problem.description}</div>
        <h4>Examples</h4>
        {(problem.examples||[]).map((ex, i) => (
          <div key={i} className="example-block">
            <div><strong>Input:</strong> <code>{ex.input}</code></div>
            <div><strong>Output:</strong> <code>{ex.output}</code></div>
            {ex.explanation && <div className="text-muted text-sm">{ex.explanation}</div>}
          </div>
        ))}
        {problem.constraints && <><h4>Constraints</h4><ul className="constraint-list">{problem.constraints.map((c,i) => <li key={i}>{c}</li>)}</ul></>}
        {problem.hints && <><h4>Hints</h4>{problem.hints.map((h,i) => <details key={i}><summary>Hint {i+1}</summary><p>{h}</p></details>)}</>}
      </div>

      {/* Editor */}
      <div className="editor-panel">
        <Editor
          defaultValue={starterCode}
          language={lang === 'javascript' ? 'javascript' : 'python'}
          theme="vs-dark"
          onMount={(editor) => { editorRef.current = editor; }}
          options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false }}
        />
      </div>

      {/* Results */}
      <div className="results-panel">
        {running && <div className="status-pill status-running">⏳ Running…</div>}
        {results && !running && (
          <>
            <div className="results-header">
              <span className={`status-pill ${results.status==='accepted'?'status-accepted':'status-wrong'}`}>
                {results.status === 'accepted' ? '✅ Accepted' : results.status === 'tle' ? '⏱ TLE' : '❌ Wrong Answer'}
              </span>
              <span className="text-muted">{results.passed}/{results.total} passed</span>
            </div>
            {(results.results||[]).map((r, i) => (
              <div key={i} className="result-row">
                <div className={`tc-badge ${r.passed?'tc-pass':'tc-fail'}`}>{r.passed?'✓':'✗'}</div>
                <div className="tc-detail">
                  <div><span className="text-muted">Input: </span><code>{r.input}</code></div>
                  <div><span className="text-muted">Expected: </span><code>{r.expected}</code>{!r.passed && <><span className="text-muted"> Got: </span><code className="text-danger">{r.actual || '(none)'}</code></>}</div>
                </div>
                <span className="text-muted text-sm">{r.runtime_ms}ms</span>
              </div>
            ))}
            {results.ai_feedback && <div className={`feedback-box ${results.status==='accepted'?'accepted':'wrong'}`}>{results.ai_feedback}</div>}
          </>
        )}
        {!results && !running && <p className="text-muted text-center" style={{padding:20}}>Run your code to see results.</p>}
      </div>
    </div>
  );
}
