import { useState, useEffect } from 'react';
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';
import { authFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend);
const COLORS = ['#6c63ff','#a855f7','#ec4899','#10b981','#f59e0b','#3b82f6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    authFetch('/interview/analytics').then(r => r.json()).then(setData).catch(() => {});
    authFetch('/ai-interview/analytics').then(r => r.json()).then(setAiStats).catch(() => {});
  }, []);

  const firstName = (user?.name || 'User').split(' ')[0];

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold">Hey, {firstName} 👋</h1>
            <p className="text-gray-500 mt-1">Your AI interview performance at a glance.</p>
          </div>
          <Link to="/ai-interview" className="btn-gradient px-6 py-3 rounded-xl font-bold text-sm">🎤 Start AI Interview</Link>
        </div>

        {/* AI Interview Stats */}
        {aiStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon="🎯" label="AI Sessions" value={aiStats.total_sessions} delay={0} />
            <StatCard icon="📊" label="Avg Score" value={aiStats.avg_score?.toFixed?.(1) || aiStats.avg_score} delay={0.05} />
            <StatCard icon="🤝" label="HR Avg" value={aiStats.by_round_type?.hr?.avg || '—'} delay={0.1} />
            <StatCard icon="⚙️" label="Tech Avg" value={aiStats.by_round_type?.technical?.avg || '—'} delay={0.15} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {[
            { to: '/ai-interview', icon: '🤝', title: 'HR Interview', desc: 'Practice communication', color: 'from-violet-600 to-purple-600' },
            { to: '/ai-interview', icon: '⚙️', title: 'Technical Interview', desc: 'Test your knowledge', color: 'from-blue-600 to-cyan-600' },
            { to: '/coding', icon: '💻', title: 'Coding Challenge', desc: 'Solve LeetCode problems', color: 'from-pink-600 to-rose-600' },
          ].map((a, i) => (
            <Link key={i} to={a.to} className="glass-card p-5 flex items-center gap-4 hover:border-gray-600 transition-all group animate-slide-up" style={{ animationDelay: `${0.2+i*0.05}s` }}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>{a.icon}</div>
              <div><div className="font-bold text-sm">{a.title}</div><div className="text-xs text-gray-500">{a.desc}</div></div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        {data && (
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-12 md:col-span-8 glass-card p-5 animate-slide-up" style={{animationDelay:'0.3s'}}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">📈 Score Trend</h3>
              <Line data={{ labels: data.charts.trend.labels, datasets: [{ label: 'Score', data: data.charts.trend.scores, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff', pointBorderColor: '#fff', pointBorderWidth: 2 }] }}
                options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.03)' } }, x: { grid: { color: 'rgba(255,255,255,0.03)' } } } }} />
            </div>
            <div className="col-span-12 md:col-span-4 glass-card p-5 animate-slide-up" style={{animationDelay:'0.35s'}}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">🕸 Topic Proficiency</h3>
              <Radar data={{ labels: data.charts.radar.labels, datasets: [{ label: 'Proficiency', data: data.charts.radar.scores, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.15)', pointBackgroundColor: COLORS }] }}
                options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }} />
            </div>
            <div className="col-span-6 md:col-span-4 glass-card p-5 animate-slide-up" style={{animationDelay:'0.4s'}}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">🍩 By Category</h3>
              <Doughnut data={{ labels: data.charts.doughnut.labels, datasets: [{ data: data.charts.doughnut.counts, backgroundColor: COLORS, borderColor: '#0a0a0f', borderWidth: 3 }] }}
                options={{ cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#888', font: { size: 10 } } } } }} />
            </div>
            <div className="col-span-6 md:col-span-4 glass-card p-5 animate-slide-up" style={{animationDelay:'0.45s'}}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">📊 Score Distribution</h3>
              <Bar data={{ labels: data.charts.distribution.labels, datasets: [{ data: data.charts.distribution.counts, backgroundColor: ['rgba(239,68,68,0.7)','rgba(245,158,11,0.7)','rgba(59,130,246,0.7)','rgba(16,185,129,0.7)','rgba(108,99,255,0.7)'], borderRadius: 6 }] }}
                options={{ plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' } } } }} />
            </div>
            <div className="col-span-12 md:col-span-4 glass-card p-5 animate-slide-up" style={{animationDelay:'0.5s'}}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">📅 Weekly Activity</h3>
              <Bar data={{ labels: data.charts.weekly.labels, datasets: [{ data: data.charts.weekly.counts, backgroundColor: 'rgba(108,99,255,0.55)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 6 }] }}
                options={{ plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' } } } }} />
            </div>
          </div>
        )}

        {/* Recent AI Sessions */}
        {aiStats?.recent_scores?.length > 0 && (
          <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.55s'}}>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">🕒 Recent AI Interview Sessions</h3>
            <div className="space-y-2">
              {aiStats.recent_scores.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm capitalize">{s.type} Interview</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.score >= 70 ? 'score-high' : s.score >= 45 ? 'score-mid' : 'score-low'}`}>{s.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, delay }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${delay}s` }}>
      <span className="text-2xl">{icon}</span>
      <div><div className="text-xl font-extrabold">{value ?? '—'}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}
