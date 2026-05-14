import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

export default function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const nav = useNavigate();

  useEffect(() => { authFetch('/coding/problems').then(r => r.json()).then(setProblems); }, []);

  const filtered = problems
    .filter(p => diff === 'all' || p.difficulty === diff)
    .filter(p => cat  === 'all' || p.category  === cat)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const solved = problems.filter(p => p.solved).length;

  return (
    <>
      <Navbar />
      <div className="page-body">
        <div className="page-header">
          <div><h1>Coding <span className="text-accent">Problems</span></h1><p className="text-muted">Practice with real interview-style challenges.</p></div>
          <input className="search-box" placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stats-bar">
          <span><strong>{problems.length}</strong> problems</span>
          <span><strong>{solved}</strong> solved</span>
          <span><strong>{problems.length - solved}</strong> remaining</span>
        </div>
        <div className="filter-bar">
          {['all','easy','medium','hard'].map(d => <button key={d} className={`filter-btn ${diff===d?'active':''}`} onClick={()=>setDiff(d)}>{d==='all'?'All':d}</button>)}
        </div>
        <div className="filter-bar" style={{marginBottom:20}}>
          {['all','arrays','strings','linked_lists','dynamic_programming'].map(c => <button key={c} className={`filter-btn ${cat===c?'active':''}`} onClick={()=>setCat(c)}>{c==='all'?'All Topics':c.replace('_',' ')}</button>)}
        </div>
        <div className="problems-grid">
          {filtered.map(p => (
            <div key={p.id} className={`problem-card ${p.solved?'solved':''}`} onClick={()=>nav(`/coding/${p.id}`)}>
              <div className="pc-header"><span className="pc-num">#{p.id}</span>{p.solved && <span className="pc-solved">✅ Solved</span>}</div>
              <div className="pc-title">{p.title}</div>
              <div className="pc-tags">{(p.tags||[]).slice(0,3).map(t => <span key={t} className="pc-tag">{t}</span>)}</div>
              <div className="pc-footer"><span className={`diff-pill diff-${p.difficulty}`}>{p.difficulty}</span><span className="text-muted text-sm">{p.category.replace('_',' ')}</span></div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">🔍 No problems match your filters.</div>}
        </div>
      </div>
    </>
  );
}
