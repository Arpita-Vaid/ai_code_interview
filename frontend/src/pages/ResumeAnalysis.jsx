import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radar, Bar } from 'react-chartjs-2';
import { authFetch, API } from '../api';
import Navbar from '../components/Navbar';

const COMPANIES = [
  { name:'Google',    icon:'🔍', accent:'#4285F4', bg:'rgba(66,133,244,0.12)' },
  { name:'Amazon',    icon:'📦', accent:'#FF9900', bg:'rgba(255,153,0,0.12)' },
  { name:'Microsoft', icon:'🪟', accent:'#00A4EF', bg:'rgba(0,164,239,0.12)' },
  { name:'Netflix',   icon:'🎬', accent:'#E50914', bg:'rgba(229,9,20,0.12)' },
  { name:'Meta',      icon:'👥', accent:'#1877F2', bg:'rgba(24,119,242,0.12)' },
  { name:'Apple',     icon:'🍎', accent:'#888888', bg:'rgba(136,136,136,0.12)' },
  { name:'TCS',       icon:'💼', accent:'#5C0057', bg:'rgba(92,0,87,0.12)' },
  { name:'Infosys',   icon:'🏢', accent:'#007CC3', bg:'rgba(0,124,195,0.12)' },
];
const ROLES = ['Frontend Developer','Backend Developer','Full Stack Developer','AI Engineer','Data Engineer','SDE'];

const PDF_TEMPLATES = [
  { key:'faang',     label:'FAANG Style',    icon:'🚀', desc:'Bold purple accent, modern layout', accent:'#7C3AED' },
  { key:'classic',   label:'Classic ATS',    icon:'📋', desc:'Professional blue, recruiter-safe', accent:'#2563EB' },
  { key:'minimal',   label:'Minimal Clean',  icon:'✦',  desc:'Black & white, ultra-clean',       accent:'#374151' },
  { key:'executive', label:'Executive',      icon:'🌿', desc:'Deep emerald, senior professional', accent:'#065F46' },
];

const Q_TABS = ['All', 'technical', 'hr', 'behavioral', 'project', 'coding'];

export default function ResumeAnalysis() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qTab, setQTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [showReanalyze, setShowReanalyze] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  // Optimization state
  const [optCompany, setOptCompany] = useState('');
  const [optRole, setOptRole] = useState(ROLES[0]);
  const [optTemplate, setOptTemplate] = useState('faang');
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [optHistory, setOptHistory] = useState([]);
  const [optTab, setOptTab] = useState('original');
  const [optError, setOptError] = useState('');
  // Preview state
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.65);

  useEffect(() => {
    Promise.all([
      authFetch(`/resume/${id}/analysis`).then(r => r.ok ? r.json() : null),
      authFetch(`/resume/${id}/questions`).then(r => r.ok ? r.json() : []),
      authFetch(`/resume/${id}/optimizations`).then(r => r.ok ? r.json() : []),
    ]).then(([an, q, opts]) => { setA(an); setQuestions(q || []); setOptHistory(opts || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const runOptimize = async () => {
    if (!optCompany || !optRole) return;
    setOptimizing(true); setOptError(''); setOptResult(null); setOptTab('original');
    try {
      const res = await authFetch(`/resume/${id}/optimize`, {
        method: 'POST',
        body: JSON.stringify({ target_company: optCompany, target_role: optRole, template: optTemplate }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Optimization failed'); }
      const d = await res.json();
      setOptResult(d);
      setOptHistory(h => [{ id: d.optimization_id, target_company: d.company, target_role: d.role, original_ats_score: d.original_ats_score, optimized_ats_score: d.optimized_ats_score, ats_improvement: d.ats_improvement, has_pdf: d.has_pdf, created_at: new Date().toISOString() }, ...h]);
      setOptTab('optimized');
    } catch(e) { setOptError(e.message); }
    finally { setOptimizing(false); }
  };

  const downloadPDF = async (optId) => {
    try {
      const res = await authFetch(`/resume/${id}/optimization/${optId}/pdf`);
      if (!res.ok) { alert('PDF not available.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `resume_optimized_${optId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed.'); }
  };

  const loadPreview = async (optId) => {
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const res = await authFetch(`/resume/${id}/optimization/${optId}/preview`);
      if (!res.ok) { setPreviewHtml('<p style="color:red;padding:20px">Preview failed to load.</p>'); return; }
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml('<p style="color:red;padding:20px">Preview error.</p>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const reanalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await authFetch(`/resume/${id}/analyze`, { method: 'POST', body: JSON.stringify({ target_role: targetRole || null, target_company: targetCompany || null }) });
      if (res.ok) { const d = await res.json(); setA(d.analysis); const qr = await authFetch(`/resume/${id}/questions`); if (qr.ok) setQuestions(await qr.json()); setShowReanalyze(false); }
    } catch {} finally { setAnalyzing(false); }
  };

  const downloadReport = () => { if (!a) return; const b = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const el = document.createElement('a'); el.href = u; el.download = `resume-analysis-${id}.json`; el.click(); URL.revokeObjectURL(u); };

  if (loading) return (<><Navbar /><div className="flex items-center justify-center h-[80vh] gap-3 text-gray-500"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" /><span>Loading analysis…</span></div></>);
  if (!a) return (<><Navbar /><div className="max-w-4xl mx-auto px-6 py-16 text-center"><div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div><p className="text-5xl mb-4">🔍</p><h2 className="text-2xl font-bold mb-2">No Analysis Yet</h2><p className="text-gray-500 mb-6">Go back and click "Analyze".</p><Link to="/resume" className="btn-gradient px-6 py-3 rounded-xl font-bold text-sm">← Back</Link></div></>);

  const scores = [
    { label: 'Overall', value: a.overall_score, color: '#6c63ff' },
    { label: 'ATS', value: a.ats_score, color: '#3b82f6' },
    { label: 'Technical', value: a.technical_score, color: '#10b981' },
    { label: 'Projects', value: a.project_score, color: '#f59e0b' },
    { label: 'Communication', value: a.communication_score, color: '#ec4899' },
    { label: 'Readability', value: a.readability_score, color: '#8b5cf6' },
    { label: 'Experience', value: a.experience_score, color: '#06b6d4' },
    { label: 'Hiring Chance', value: a.confidence_score, color: '#f43f5e' },
  ];

  const sc = (s) => s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';
  const pb = (p) => p === 'high' ? 'bg-red-500/15 text-red-400' : p === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400';
  const db = (d) => d === 'hard' ? 'pill-hard' : d === 'medium' ? 'pill-medium' : 'pill-easy';
  const sb = (s) => s === 'critical' ? 'bg-red-500/15 text-red-400 border-red-500/20' : s === 'high' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  const filteredQ = qTab === 'All' ? questions : questions.filter(q => q.category === qTab);

  const sections = [
    { key: 'overview',  icon: '📊', label: 'Overview' },
    { key: 'ats',       icon: '🤖', label: 'ATS Deep Dive' },
    { key: 'skills',    icon: '💡', label: 'Skill Gap' },
    { key: 'feedback',  icon: '💬', label: 'AI Feedback' },
    { key: 'roadmap',   icon: '🗺️', label: 'Roadmap' },
    { key: 'questions', icon: '🎤', label: 'Questions' },
    { key: 'optimize',  icon: '✨', label: 'AI Optimize' },
  ];

  return (
    <><Navbar />
    <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 animate-slide-up">
        <div className="flex items-center gap-3">
          <Link to="/resume" className="text-gray-500 hover:text-white transition-colors">←</Link>
          <h1 className="text-2xl font-extrabold">Resume Analysis</h1>
          {a.skill_gap_analysis?.target_role && <span className="px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium">{a.skill_gap_analysis.target_role}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReanalyze(!showReanalyze)} className="px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 hover:border-white/20 transition-all">🎯 Re-analyze</button>
          <button onClick={downloadReport} className="px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 hover:border-white/20 transition-all">📥 Report</button>
        </div>
      </div>

      {showReanalyze && (
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <div className="flex gap-3 flex-wrap">
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Target Role (e.g. Frontend Developer)" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-violet-500/50" />
            <input value={targetCompany} onChange={e => setTargetCompany(e.target.value)} placeholder="Company (optional)" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-violet-500/50" />
            <button onClick={reanalyze} disabled={analyzing} className="btn-gradient px-5 py-2 rounded-lg text-sm font-bold">{analyzing ? '⏳ Analyzing...' : '🔍 Analyze'}</button>
          </div>
        </div>
      )}

      {/* Section Nav */}
      <div className="flex gap-1.5 mb-6 flex-wrap animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSection === s.key ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === 'overview' && <>
        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {scores.map((s, i) => (
            <div key={i} className="glass-card p-4 text-center group hover:border-gray-600 transition-all">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke={s.color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(s.value||0)*1.508} 151`} style={{transition:'stroke-dasharray 1.2s ease'}}/>
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${sc(s.value)}`}>{s.value!=null?Math.round(s.value):'—'}</div>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Radar + Strengths/Weaknesses */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-5 glass-card p-5 animate-slide-up" style={{animationDelay:'0.15s'}}>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">🕸 Score Radar</h3>
            <Radar data={{labels:scores.slice(0,7).map(s=>s.label),datasets:[{data:scores.slice(0,7).map(s=>s.value||0),borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,0.15)',pointBackgroundColor:scores.slice(0,7).map(s=>s.color)}]}} options={{scales:{r:{min:0,max:100,ticks:{stepSize:25},grid:{color:'rgba(255,255,255,0.05)'}}},plugins:{legend:{display:false}}}} />
          </div>
          <div className="col-span-12 md:col-span-7 grid gap-3 animate-slide-up" style={{animationDelay:'0.2s'}}>
            {a.strengths?.length > 0 && <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">💪 Strengths</h3>
              <div className="space-y-2">{a.strengths.map((s,i)=>(<div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"><div><span className="text-sm font-medium">{s.area}</span><p className="text-xs text-gray-400">{s.detail}</p></div><span className={`text-sm font-bold ${sc(s.score)}`}>{s.score}</span></div>))}</div>
            </div>}
            {a.weaknesses?.length > 0 && <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">⚡ Weaknesses</h3>
              <div className="space-y-2">{a.weaknesses.map((w,i)=>(<div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10"><div><span className="text-sm font-medium">{w.area}</span><p className="text-xs text-gray-400">{w.detail}</p></div><span className={`text-sm font-bold ${sc(w.score)}`}>{w.score}</span></div>))}</div>
            </div>}
          </div>
        </div>

        {/* Skills Tags */}
        {a.skills?.length > 0 && <div className="glass-card p-5 mb-4 animate-slide-up" style={{animationDelay:'0.25s'}}>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">💡 Detected Skills</h3>
          <div className="flex flex-wrap gap-2">{a.skills.map((s,i)=>(<span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/12 text-violet-300 border border-violet-500/20">{s}</span>))}</div>
        </div>}
      </>}

      {/* ═══ ATS DEEP DIVE ═══ */}
      {activeSection === 'ats' && <>
        {/* ATS Breakdown Bars */}
        {a.ats_breakdown && <div className="glass-card p-5 mb-4 animate-slide-up">
          <h3 className="text-sm font-semibold text-blue-400 mb-4">🤖 ATS Score Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(a.ats_breakdown).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{v.label}</span><span className="font-bold">{v.score}/{v.max}</span></div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{width:`${(v.score/v.max)*100}%`,background: v.score/v.max >= 0.7 ? 'linear-gradient(90deg,#10b981,#34d399)' : v.score/v.max >= 0.4 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)'}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between"><span className="text-sm font-semibold">Total ATS Score</span><span className={`text-lg font-bold ${sc(a.ats_score)}`}>{Math.round(a.ats_score)}/100</span></div>
        </div>}

        {/* ATS Issues */}
        {a.ats_issues?.length > 0 && <div className="glass-card p-5 mb-4 animate-slide-up" style={{animationDelay:'0.05s'}}>
          <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠️ ATS Issues ({a.ats_issues.length})</h3>
          <div className="space-y-2">{a.ats_issues.map((issue, i) => {
            const iss = typeof issue === 'string' ? { issue, severity: 'medium', fix: '' } : issue;
            return (<div key={i} className={`p-3 rounded-xl border ${sb(iss.severity)}`}><div className="flex items-center gap-2 mb-1"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${sb(iss.severity)}`}>{iss.severity}</span><span className="text-sm font-medium">{iss.issue}</span></div>{iss.fix && <p className="text-xs text-gray-400 ml-6">💡 {iss.fix}</p>}</div>);
          })}</div>
        </div>}

        {/* Keywords */}
        {a.keyword_analysis && <div className="grid md:grid-cols-2 gap-4 mb-4 animate-slide-up" style={{animationDelay:'0.1s'}}>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">✅ Keywords Found ({a.keyword_analysis.present?.length||0})</h3>
            <div className="flex flex-wrap gap-1.5">{(a.keyword_analysis.present||[]).map((k,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/12 text-emerald-300 border border-emerald-500/20">{k}</span>))}</div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-red-400 mb-2">❌ Missing Keywords ({a.keyword_analysis.missing?.length||0})</h3>
            <div className="flex flex-wrap gap-1.5">{(a.keyword_analysis.missing||[]).map((k,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-500/12 text-red-300 border border-red-500/20">{k}</span>))}</div>
            {a.keyword_analysis.relevance_score != null && <div className="mt-3 pt-2 border-t border-white/5 text-xs text-gray-400">Keyword Relevance: <span className={`font-bold ${sc(a.keyword_analysis.relevance_score)}`}>{a.keyword_analysis.relevance_score}%</span></div>}
          </div>
        </div>}

        {a.missing_sections?.length > 0 && <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.15s'}}>
          <h3 className="text-sm font-semibold text-red-400 mb-3">📋 Missing Sections</h3>
          <div className="space-y-1.5">{a.missing_sections.map((m,i)=>(<div key={i} className="flex items-center gap-2 text-sm text-gray-300"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"/>{m}</div>))}</div>
        </div>}
      </>}

      {/* ═══ SKILL GAP ═══ */}
      {activeSection === 'skills' && <>
        {a.skill_gap_analysis && <div className="glass-card p-5 mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400">🎯 Skill Match for <span className="text-violet-400">{a.skill_gap_analysis.target_role}</span></h3>
            <span className={`text-2xl font-bold ${sc(a.skill_gap_analysis.match_percentage)}`}>{a.skill_gap_analysis.match_percentage}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-1000" style={{width:`${a.skill_gap_analysis.match_percentage}%`}}/>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 mb-2">✅ Matched ({a.skill_gap_analysis.matched_skills?.length||0})</h4>
              <div className="flex flex-wrap gap-1.5">{(a.skill_gap_analysis.matched_skills||[]).map((s,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/12 text-emerald-300 border border-emerald-500/20">{s}</span>))}</div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-400 mb-2">❌ Missing ({a.skill_gap_analysis.missing_skills?.length||0})</h4>
              <div className="flex flex-wrap gap-1.5">{(a.skill_gap_analysis.missing_skills||[]).map((s,i)=>(<span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-500/12 text-red-300 border border-red-500/20">{s}</span>))}</div>
            </div>
          </div>
        </div>}

        {/* Tech category breakdown */}
        {a.skill_gap_analysis?.skill_categories && <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">📊 Technology Categories</h3>
          <Bar data={{labels:Object.keys(a.skill_gap_analysis.skill_categories).map(k=>k.replace('_','/')),datasets:[{data:Object.values(a.skill_gap_analysis.skill_categories),backgroundColor:['rgba(108,99,255,0.6)','rgba(59,130,246,0.6)','rgba(16,185,129,0.6)','rgba(245,158,11,0.6)','rgba(236,72,153,0.6)','rgba(168,85,247,0.6)'],borderRadius:6}]}} options={{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,0.03)'}}}}} />
        </div>}
      </>}

      {/* ═══ AI FEEDBACK ═══ */}
      {activeSection === 'feedback' && <>
        {a.suggestions?.length > 0 && <div className="glass-card p-5 mb-4 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">💡 AI Suggestions ({a.suggestions.length})</h3>
          <div className="space-y-3">{a.suggestions.map((s,i)=>(
            <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pb(s.priority)}`}>{s.priority}</span>
                <span className="text-sm font-semibold">{s.title}</span>
                {s.impact && <span className="ml-auto text-[10px] text-emerald-400 font-medium">{s.impact}</span>}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
            </div>
          ))}</div>
        </div>}

        {a.weak_areas?.length > 0 && <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
          <h3 className="text-sm font-semibold text-amber-400 mb-3">🔻 Weak Areas</h3>
          <div className="space-y-1.5">{a.weak_areas.map((w,i)=>(<div key={i} className="flex items-center gap-2 text-sm text-gray-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"/>{w}</div>))}</div>
        </div>}
      </>}

      {/* ═══ ROADMAP ═══ */}
      {activeSection === 'roadmap' && a.improvement_roadmap?.length > 0 && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">🗺️ Improvement Roadmap</h3>
          <div className="space-y-3">
            {a.improvement_roadmap.map((step, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{step.step}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{step.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${step.impact==='high'?'bg-emerald-500/15 text-emerald-400':'bg-blue-500/15 text-blue-400'}`}>{step.impact} impact</span>
                    {step.effort && <span className="text-[10px] text-gray-500">⏱ {step.effort}</span>}
                  </div>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ QUESTIONS ═══ */}
      {activeSection === 'questions' && questions.length > 0 && (
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🎤 Interview Questions ({questions.length})</h3>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {Q_TABS.map(t => (<button key={t} onClick={() => setQTab(t)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${qTab===t?'bg-violet-500/20 text-violet-300 border border-violet-500/30':'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t==='All'?`All (${questions.length})`:`${t.charAt(0).toUpperCase()+t.slice(1)} (${questions.filter(q=>q.category===t).length})`}</button>))}
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredQ.map((q,i)=>(
              <div key={q.id||i} className="p-3 rounded-xl bg-white/3 border border-white/5 flex items-start gap-3">
                <span className="text-lg mt-0.5">{q.category==='technical'?'⚙️':q.category==='hr'?'🤝':q.category==='behavioral'?'🧠':q.category==='project'?'📁':'💻'}</span>
                <div className="flex-1"><p className="text-sm">{q.question_text}</p><div className="flex gap-2 mt-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${db(q.difficulty)}`}>{q.difficulty}</span>{q.source_detail&&<span className="text-[10px] text-gray-500">from: {q.source_detail}</span>}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ AI OPTIMIZE ═══ */}
      {activeSection === 'optimize' && <>
        {/* Company Cards */}
        <div className="glass-card p-5 mb-4 animate-slide-up">
          <h3 className="text-sm font-bold mb-1">✨ AI Company-Specific Optimizer</h3>
          <p className="text-xs text-gray-500 mb-4">Select a company and role — Gemini will rewrite your resume to match their hiring culture.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {COMPANIES.map(c => (
              <button key={c.name} onClick={() => setOptCompany(c.name)}
                style={{ border: `1px solid ${optCompany===c.name ? c.accent : 'rgba(255,255,255,0.07)'}`, background: optCompany===c.name ? c.bg : 'transparent' }}
                className="flex items-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-0.5">
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs font-semibold">{c.name}</span>
                {optCompany===c.name && <span className="ml-auto text-[10px]" style={{color:c.accent}}>✓</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {ROLES.map(r => (
              <button key={r} onClick={() => setOptRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${optRole===r ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 bg-white/5'}`}>
                {r}
              </button>
            ))}
          </div>
          {/* Template Selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">📄 Resume Template</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PDF_TEMPLATES.map(t => (
                <button key={t.key} onClick={() => setOptTemplate(t.key)}
                  style={{
                    border: `1px solid ${optTemplate===t.key ? t.accent : 'rgba(255,255,255,0.07)'}`,
                    background: optTemplate===t.key ? `${t.accent}18` : 'transparent',
                  }}
                  className="p-3 rounded-xl text-left transition-all hover:-translate-y-0.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs font-bold">{t.label}</span>
                    {optTemplate===t.key && <span className="ml-auto text-[10px] font-bold" style={{color:t.accent}}>✓</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug">{t.desc}</p>
                  <div className="mt-1.5 h-1.5 rounded-full w-full" style={{background:`${t.accent}40`}}>
                    <div className="h-full rounded-full" style={{width:'70%',background:t.accent}}/>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {optError && <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">❌ {optError}</div>}
          <button onClick={runOptimize} disabled={!optCompany || optimizing}
            className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-2">
            {optimizing ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full loader-spin"/> Optimizing with Gemini AI...</> : '🚀 Optimize Resume'}
          </button>
        </div>

        {/* Optimization Result */}
        {optimizing && (
          <div className="glass-card p-6 mb-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4"><div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full loader-spin"/><span className="text-sm font-semibold">Gemini is rewriting your resume for {optCompany}…</span></div>
            {['Parsing resume sections','Analyzing company culture & values','Rewriting project descriptions','Optimizing ATS keywords','Generating PDF'].map((s,i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/></div>
                <span className="text-xs text-gray-400">{s}</span>
              </div>
            ))}
          </div>
        )}

        {optResult && (
          <div className="animate-slide-up">
            {/* Score Comparison */}
            <div className="glass-card p-5 mb-4" style={{borderColor:`${COMPANIES.find(c=>c.name===optResult.company)?.accent}30`}}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-bold">📈 ATS Score Improvement</h3>
                <span className="px-3 py-1 rounded-full text-sm font-bold" style={{background:'rgba(16,185,129,0.15)',color:'#6ee7b7'}}>+{optResult.ats_improvement} points</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[{label:'Original ATS',val:optResult.original_ats_score,color:'rgba(239,68,68,0.7)'},{label:`${optResult.company} Optimized`,val:optResult.optimized_ats_score,color:'rgba(16,185,129,0.7)'}].map((s,i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{s.label}</span><span className="font-bold">{s.val}/100</span></div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{width:`${s.val}%`,background:s.color}}/></div>
                  </div>
                ))}
              </div>
              {optResult.optimization_summary && <p className="text-xs text-gray-400 italic">{optResult.optimization_summary}</p>}
            </div>

            {/* Before / After Tabs */}
            <div className="glass-card p-5 mb-4">
              <div className="flex gap-2 mb-4">
                {['original','optimized'].map(t => (
                  <button key={t} onClick={() => setOptTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${optTab===t ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 bg-white/5'}`}>
                    {t === 'original' ? '📄 Original' : '✨ Optimized'}
                  </button>
                ))}
                {optResult.has_pdf && (
                <button onClick={() => downloadPDF(optResult.optimization_id)}
                  className="ml-auto px-4 py-1.5 rounded-lg text-xs font-semibold btn-gradient flex items-center gap-1.5">📥 Download PDF</button>
              )}
              <button
                onClick={() => {
                  if (showPreview) { setShowPreview(false); }
                  else { loadPreview(optResult.optimization_id); }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  showPreview
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {showPreview ? '🙈 Hide Preview' : '👁 Live Preview'}
              </button>
              </div>

              {optTab === 'original' ? (
                <div className="space-y-3">
                  {a.summary_text && <div><div className="text-xs font-semibold text-gray-400 mb-1">Summary</div><p className="text-sm text-gray-300 leading-relaxed p-3 rounded-lg bg-white/3">{a.summary_text}</p></div>}
                  {a.skills?.length > 0 && <div><div className="text-xs font-semibold text-gray-400 mb-1">Skills</div><div className="flex flex-wrap gap-1.5">{a.skills.slice(0,15).map((s,i) => <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300">{s}</span>)}</div></div>}
                </div>
              ) : (
                <div className="space-y-4">
                  {optResult.optimized_summary && (
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 mb-1">✨ Optimized Summary</div>
                      <p className="text-sm text-gray-200 leading-relaxed p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">{optResult.optimized_summary}</p>
                    </div>
                  )}
                  {optResult.optimized_skills?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 mb-1">✨ Optimized Skills</div>
                      <div className="flex flex-wrap gap-1.5">{optResult.optimized_skills.slice(0,18).map((s,i) => <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</span>)}</div>
                    </div>
                  )}
                  {optResult.optimized_projects?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 mb-2">✨ Optimized Projects</div>
                      <div className="space-y-2">{optResult.optimized_projects.map((p,i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5">
                          <div className="text-xs font-bold mb-1">{p.name}</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{p.optimized_description}</p>
                          {p.added_keywords?.length > 0 && <div className="flex gap-1 flex-wrap mt-1.5">{p.added_keywords.map((k,j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">+ {k}</span>)}</div>}
                        </div>
                      ))}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Live Preview Panel ── */}
            {showPreview && (
              <div className="glass-card p-4 mb-4 animate-slide-up">
                {/* Preview controls */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-sm font-bold">👁 Live Resume Preview</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Zoom:</span>
                    {[0.5, 0.65, 0.8, 1.0].map(z => (
                      <button
                        key={z}
                        onClick={() => setPreviewZoom(z)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          previewZoom === z
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'text-gray-500 hover:text-gray-300 bg-white/5'
                        }`}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                    <button
                      onClick={() => setShowPreview(false)}
                      className="ml-2 text-gray-500 hover:text-white text-xs px-2 py-0.5 rounded bg-white/5"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {/* Preview frame */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    height: `${Math.round(842 * previewZoom)}px`,
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {previewLoading ? (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: '#f8fafc', flexDirection: 'column', gap: '12px'
                    }}>
                      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full loader-spin" />
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>Rendering resume…</p>
                    </div>
                  ) : (
                    <iframe
                      srcDoc={previewHtml}
                      title="Resume Preview"
                      style={{
                        width: `${Math.round(100 / previewZoom)}%`,
                        height: `${Math.round(100 / previewZoom)}%`,
                        border: 'none',
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        background: '#ffffff',
                      }}
                      sandbox="allow-same-origin"
                    />
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center">
                  This is a live HTML preview. The downloaded PDF may vary slightly by renderer.
                </p>
              </div>
            )}

            {/* Modifications Highlight */}
            {optResult.modifications?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-sm font-bold mb-3">🔍 AI Modifications ({optResult.modifications.length})</h3>
                <div className="space-y-2">{optResult.modifications.map((m,i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(168,85,247,0.15)',color:'#c084fc'}}>{m.type}</span>
                      <span className="text-[10px] text-gray-500 capitalize">{m.section}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-red-500/5 border border-red-500/10 text-gray-400 line-through">{m.original?.slice(0,100)}…</div>
                      <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-gray-200">{m.optimized?.slice(0,100)}…</div>
                    </div>
                    {m.reason && <p className="text-[10px] text-gray-500 mt-1">💡 {m.reason}</p>}
                  </div>
                ))}</div>
              </div>
            )}

            {/* Company Tips */}
            {optResult.company_tips?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-sm font-bold mb-3">🎯 {optResult.company} Interview Tips</h3>
                <div className="space-y-2">{optResult.company_tips.map((t,i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-violet-400 shrink-0">→</span>{t}</div>
                ))}</div>
              </div>
            )}

            {/* Added Keywords */}
            {optResult.added_keywords?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="text-sm font-bold mb-3">🔑 ATS Keywords Added</h3>
                <div className="flex flex-wrap gap-2">{optResult.added_keywords.map((k,i) => <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/12 text-blue-300 border border-blue-500/20">+ {k}</span>)}</div>
              </div>
            )}
          </div>
        )}

        {/* Optimization History */}
        {optHistory.length > 0 && (
          <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
            <h3 className="text-sm font-bold mb-3">🕐 Optimization History ({optHistory.length})</h3>
            <div className="space-y-2">{optHistory.map((o,i) => (
              <div key={o.id||i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-400">{COMPANIES.find(c=>c.name===o.target_company)?.icon||'✨'}</div>
                <div className="flex-1"><div className="text-xs font-semibold">{o.target_company} — {o.target_role}</div><div className="text-[10px] text-gray-500">{new Date(o.created_at).toLocaleDateString()}</div></div>
                <span className="text-xs font-bold text-emerald-400">+{o.ats_improvement} ATS</span>
                {o.has_pdf && <button onClick={() => downloadPDF(o.id)} className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 hover:text-white">📥 PDF</button>}
              </div>
            ))}</div>
          </div>
        )}
      </>}
    </div></>
  );
}
