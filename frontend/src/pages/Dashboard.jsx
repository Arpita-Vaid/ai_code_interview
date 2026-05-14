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

  useEffect(() => {
    authFetch('/interview/analytics').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <><Navbar /><div className="page-loader"><div className="loader-spinner" /><span>Loading dashboard…</span></div></>;

  const { stats, charts, recent_sessions } = data;
  const firstName = (user?.name || 'User').split(' ')[0];

  return (
    <>
      <Navbar />
      <div className="page-body">
        <div className="page-header">
          <div><h1>Hey, {firstName} 👋</h1><p className="text-muted">Your AI interview performance at a glance.</p></div>
          <Link to="/interview" className="btn btn-primary">🎤 Start Interview</Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="🎯" label="Sessions" value={stats.total_sessions} color="purple" />
          <StatCard icon="📊" label="Avg Score" value={stats.avg_score?.toFixed(1)} color="pink" />
          <StatCard icon="🏆" label="Best Score" value={stats.best_score} color="green" />
          <StatCard icon="💬" label="Answered" value={stats.total_answers} color="amber" />
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card col-8">
            <h3 className="chart-title">📈 Score Trend</h3>
            <Line data={{
              labels: charts.trend.labels,
              datasets: [{ label: 'Score', data: charts.trend.scores, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff', pointBorderColor: '#fff', pointBorderWidth: 2 }],
            }} options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
          </div>
          <div className="chart-card col-4">
            <h3 className="chart-title">🕸 Topic Proficiency</h3>
            <Radar data={{
              labels: charts.radar.labels,
              datasets: [{ label: 'Proficiency', data: charts.radar.scores, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.15)', pointBackgroundColor: COLORS }],
            }} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } }, plugins: { legend: { display: false } } }} />
          </div>
          <div className="chart-card col-4">
            <h3 className="chart-title">🍩 By Category</h3>
            <Doughnut data={{
              labels: charts.doughnut.labels, datasets: [{ data: charts.doughnut.counts, backgroundColor: COLORS, borderColor: '#0a0a0f', borderWidth: 3 }],
            }} options={{ cutout: '68%', plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="chart-card col-4">
            <h3 className="chart-title">📊 Score Distribution</h3>
            <Bar data={{
              labels: charts.distribution.labels,
              datasets: [{ data: charts.distribution.counts, backgroundColor: ['rgba(239,68,68,0.7)','rgba(245,158,11,0.7)','rgba(59,130,246,0.7)','rgba(16,185,129,0.7)','rgba(108,99,255,0.7)'], borderRadius: 6 }],
            }} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <div className="chart-card col-4">
            <h3 className="chart-title">📅 Weekly Activity</h3>
            <Bar data={{
              labels: charts.weekly.labels,
              datasets: [{ data: charts.weekly.counts, backgroundColor: 'rgba(108,99,255,0.55)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 6 }],
            }} options={{ plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="chart-card">
          <h3 className="chart-title">🕒 Recent Sessions</h3>
          <table className="sessions-table">
            <thead><tr><th>Category</th><th>Difficulty</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {(!recent_sessions || recent_sessions.length === 0) ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{padding:24}}>No sessions yet. <Link to="/interview">Start one →</Link></td></tr>
              ) : recent_sessions.map((s,i) => (
                <tr key={i}>
                  <td>{s.category}</td>
                  <td><span className={`diff-pill diff-${s.difficulty}`}>{s.difficulty}</span></td>
                  <td><span className={`score-pill ${s.score>=70?'score-high':s.score>=45?'score-mid':'score-low'}`}>{s.score}/100</span></td>
                  <td>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}
