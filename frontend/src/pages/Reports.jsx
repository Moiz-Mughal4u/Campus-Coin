import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';
import { Download, Calendar, TrendingUp } from 'lucide-react';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [range, setRange] = useState('daily');
  const [categoryReport, setCategoryReport] = useState([]);
  const [trend, setTrend] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get(`/reports/category-wise?month=${month}`).then((res) => setCategoryReport(res.data.breakdown));
    api.get(`/reports/summary?range=${range}&month=${month}`).then((res) => setSummary(res.data.rows));
  }, [month, range]);
  useEffect(() => { api.get('/reports/income-vs-expense').then((res) => setTrend(res.data)); }, []);

  function downloadPdf() {
    const token = localStorage.getItem('cc_token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export.pdf?month=${month}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.blob()).then((blob) => {
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
      link.download = `campus-coin-report-${month}.pdf`; link.click();
    });
  }

  const expenseData = categoryReport.filter((c) => c.type === 'expense').map((c) => ({ name: c.name, total: Number(c.total) }));

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Reports']} />
      <h1><TrendingUp size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Reports</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>Filter by month, category or date range, then export a copy.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="field" style={{ minWidth: 150, marginBottom: 0 }}><label><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />Month</label><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
        <div className="field" style={{ minWidth: 150, marginBottom: 0 }}><label>Summary range</label><select value={range} onChange={(e) => setRange(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
        <button className="btn secondary" onClick={downloadPdf} style={{ marginBottom: 0 }}><Download size={16} /> Export PDF</button>
      </div>

      <div className="content-grid" style={{ marginBottom: 24 }}>
        <div className="panel">
          <div className="tab">Category spending — {month}</div>
          <div style={{ height: 280, marginTop: 20 }}>
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink)' }} />
                  <Tooltip contentStyle={{ background: 'var(--paper-dim)', border: '1px solid var(--line)', borderRadius: 8 }} />
                  <Bar dataKey="total" fill="var(--gold)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><p className="help-text">No expenses for {month}.</p></div>}
          </div>
        </div>
        <div className="panel">
          <div className="tab">Income vs. expense — last 6 months</div>
          <div style={{ height: 280, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--ink)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink)' }} />
                <Tooltip contentStyle={{ background: 'var(--paper-dim)', border: '1px solid var(--line)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" stroke="var(--mint)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="var(--coral)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="tab">{range === 'weekly' ? 'Weekly' : 'Daily'} summary — {month}</div>
        <div className="table-responsive" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>{range === 'weekly' ? 'Week' : 'Date'}</th><th>Income</th><th>Expense</th></tr></thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={i}><td>{row.label}</td><td style={{ color: 'var(--mint)', fontWeight: 600 }}>{Number(row.income).toFixed(2)}</td><td style={{ color: 'var(--coral)', fontWeight: 600 }}>{Number(row.expense).toFixed(2)}</td></tr>
              ))}
              {summary.length === 0 && <tr><td colSpan={3} className="help-text">Nothing to summarize yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}