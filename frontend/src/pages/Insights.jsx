import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';
import { Lightbulb, Bookmark, Pin, X } from 'lucide-react';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function Insights() {
  const [month, setMonth] = useState(currentMonth());
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [tips, setTips] = useState([]);

  function loadInsight() { api.get(`/insights?month=${month}`).then((res) => setInsight(res.data)); }
  function loadTips() { api.get('/tips').then((res) => setTips(res.data)); }
  useEffect(loadInsight, [month]);
  useEffect(() => { loadTips(); api.get('/insights/history').then((res) => setHistory(res.data)); }, []);

  async function toggleBookmark() { const res = await api.put(`/insights/${insight.insight_id}/bookmark`); setInsight({ ...insight, is_bookmarked: res.data.is_bookmarked }); }
  async function actOnTip(id, action) { await api.put(`/tips/${id}/${action}`); loadTips(); }

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Insights & Tips']} />
      <h1><Lightbulb size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: 'var(--gold)' }} />Insights & saving tips</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>Generated from your transaction history. Suggestions, not financial advice.</p>
      <div className="field" style={{ width: 160, marginBottom: 20 }}><label>Month</label><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>

      {insight && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="tab">Monthly snapshot</div>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6 }}>{insight.summary_text}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <span className="pill neutral" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} color="var(--gold)" /> {insight.tip_text}</span>
            <button className="btn small secondary" onClick={toggleBookmark} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bookmark size={14} fill={insight.is_bookmarked ? 'var(--gold)' : 'none'} /> {insight.is_bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
          </div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="tab">Personalized saving tips</div>
        <div style={{ marginTop: 16 }}>
          {tips.length === 0 && <p className="help-text">No active tips — log more transactions.</p>}
          {tips.map((t) => (
            <div key={t.tip_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={{ fontSize: 14, marginBottom: 4 }}>{t.tip_text}</div><div className="help-text">Savings: <strong style={{ color: 'var(--mint)' }}>{Number(t.potential_savings).toFixed(2)}</strong></div></div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn small secondary" onClick={() => actOnTip(t.tip_id, 'pin')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Pin size={14} /> {t.status === 'pinned' ? 'Pinned' : 'Pin'}</button>
                <button className="btn small danger" onClick={() => actOnTip(t.tip_id, 'dismiss')} style={{ padding: '4px 8px' }}><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="tab">Past months</div>
        <div style={{ marginTop: 16 }}>
          {history.length === 0 && <p className="help-text">No history yet.</p>}
          {history.map((h) => (<div key={h.insight_id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}><strong>{h.month}</strong> — {h.summary_text} {h.is_bookmarked && <Bookmark size={12} fill="var(--gold)" style={{ display: 'inline', marginLeft: 4 }} />}</div>))}
        </div>
      </div>
    </div>
  );
}