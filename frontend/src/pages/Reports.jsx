import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

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

  useEffect(() => {
    api.get('/reports/income-vs-expense').then((res) => setTrend(res.data));
  }, []);

  function downloadPdf() {
    const token = localStorage.getItem('cc_token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export.pdf?month=${month}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `campus-coin-report-${month}.pdf`;
        link.click();
      });
  }

  const expenseData = categoryReport.filter((c) => c.type === 'expense').map((c) => ({ name: c.name, total: Number(c.total) }));

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Reports']} />
      <h1>Reports</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>Filter by month, category or date range, then export a copy for your records.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 22 }}>
        <div className="field" style={{ width: 160 }}>
          <label>Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label>Summary range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <button className="btn secondary" onClick={downloadPdf} style={{ marginBottom: 14 }}>⬇ Export PDF</button>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="tab">Category-wise spending — {month}</div>
        <div style={{ height: 260, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#E8B84B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {expenseData.length === 0 && <p className="help-text">No expenses recorded for {month}.</p>}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="tab">Income vs. expense — last 6 months</div>
        <div style={{ height: 260, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#2F9E67" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#D64545" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="tab">{range === 'weekly' ? 'Weekly' : 'Daily'} summary — {month}</div>
        <table style={{ marginTop: 14 }}>
          <thead><tr><th>{range === 'weekly' ? 'Week' : 'Date'}</th><th>Income</th><th>Expense</th></tr></thead>
          <tbody>
            {summary.map((row, i) => (
              <tr key={i}>
                <td>{row.label}</td>
                <td style={{ color: 'var(--mint)' }}>{Number(row.income).toFixed(2)}</td>
                <td style={{ color: 'var(--coral)' }}>{Number(row.expense).toFixed(2)}</td>
              </tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={3} className="help-text">Nothing to summarize yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
