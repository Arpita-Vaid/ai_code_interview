import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { key: 'all', label: 'All Topics' },
  { key: 'arrays', label: 'Arrays' },
  { key: 'strings', label: 'Strings' },
  { key: 'linked_lists', label: 'Linked Lists' },
  { key: 'trees', label: 'Trees' },
  { key: 'dynamic_programming', label: 'Dynamic Programming' },
];

const DIFF_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    authFetch('/coding/problems')
      .then(r => r.json())
      .then(data => { setProblems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = problems
    .filter(p => diff === 'all' || p.difficulty === diff)
    .filter(p => cat === 'all' || p.category === cat)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const solved = problems.filter(p => p.solved).length;
  const easyCount = problems.filter(p => p.difficulty === 'easy').length;
  const medCount = problems.filter(p => p.difficulty === 'medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'hard').length;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              Coding <span className="text-gradient">Problems</span>
            </h1>
            <p className="text-gray-500 text-sm">Practice with real interview-style coding challenges.</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              placeholder="Search problems…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card px-4 py-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <span className="text-xl">📚</span>
            <div>
              <div className="text-lg font-bold">{problems.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-xl">✅</span>
            <div>
              <div className="text-lg font-bold text-emerald-400">{solved}</div>
              <div className="text-xs text-gray-500">Solved</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <span className="text-xl">🟢</span>
            <div>
              <div className="text-lg font-bold">{easyCount} <span className="text-xs text-gray-500 font-normal">/ {medCount} / {hardCount}</span></div>
              <div className="text-xs text-gray-500">E / M / H</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-xl">🎯</span>
            <div>
              <div className="text-lg font-bold">{problems.length - solved}</div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2 mb-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {['all', 'easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer
                ${diff === d
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
                }`}
            >
              {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer
                ${cat === c.key
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" />
            <span className="text-sm">Loading problems…</span>
          </div>
        )}

        {/* Problem Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                onClick={() => nav(`/coding/${p.id}`)}
                className={`glass-card p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden animate-slide-up
                  hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-500/20
                  ${p.solved ? 'border-emerald-500/15' : ''}
                `}
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                {/* Top gradient line on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Header: Number + Solved */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 font-mono">#{p.id}</span>
                  {p.solved && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Solved
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-base mb-3 group-hover:text-white transition-colors leading-snug">
                  {p.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(p.tags || []).slice(0, 3).map(t => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-500 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer: Difficulty + Category */}
                <div className="flex items-center justify-between mt-auto">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${DIFF_COLORS[p.difficulty] || ''}`}>
                    {p.difficulty}
                  </span>
                  <span className="text-[11px] text-gray-600 capitalize">
                    {(p.category || '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-3 opacity-30">🔍</div>
                <p className="text-gray-500 text-sm">No problems match your filters.</p>
                <button
                  onClick={() => { setDiff('all'); setCat('all'); setSearch(''); }}
                  className="mt-3 text-xs text-[var(--color-accent-light)] hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
