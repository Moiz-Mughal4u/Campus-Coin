import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function Insights() {
  const [month, setMonth] = useState(currentMonth());
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [tips, setTips] = useState([]);

  function loadInsight() {
    api.get(`/insights?month=${month}`).then((res) => setInsight(res.data));
  }
  function loadTips() {
    api.get('/tips').then((res) => setTips(res.data));
  }

  useEffect(loadInsight, [month]);
  useEffect(() => {
    loadTips();
    api.get('/insights/history').then((res) => setHistory(res.data));
  }, []);

  async function toggleBookmark() {
    const res = await api.put(`/insights/${insight.insight_id}/bookmark`);
    setInsight({ ...insight, is_bookmarked: res.data.is_bookmarked });
  }

  async function actOnTip(id, action) {
    await api.put(`/tips/${id}/${action}`);
    loadTips();
  }

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Insights & Tips']} />
      <h1>Insights & saving tips</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>
        Generated from your own transaction history. These are suggestions to review, not certified financial advice.
      </p>

      <div className="field" style={{ width: 160, marginBottom: 20 }}>
        <label>Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {insight && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="tab">Monthly snapshot</div>
          <p style={{ marginTop: 14, fontSize: 15 }}>{insight.summary_text}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span className="pill neutral">💡 {insight.tip_text}</span>
            <button className="btn small secondary" onClick={toggleBookmark}>
              {insight.is_bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
          </div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="tab">Personalized saving tips</div>
        <div style={{ marginTop: 14 }}>
          {tips.length === 0 && <p className="help-text">No active tips right now — check back after logging more transactions.</p>}
          {tips.map((t) => (
            <div key={t.tip_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: 14 }}>{t.tip_text}</div>
                <div className="help-text">Potential savings: {Number(t.potential_savings).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn small secondary" onClick={() => actOnTip(t.tip_id, 'pin')}>{t.status === 'pinned' ? '📌 Pinned' : 'Pin'}</button>
                <button className="btn small danger" onClick={() => actOnTip(t.tip_id, 'dismiss')}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="tab">Past months</div>
        <div style={{ marginTop: 14 }}>
          {history.length === 0 && <p className="help-text">No insight history yet.</p>}
          {history.map((h) => (
            <div key={h.insight_id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
              <strong>{h.month}</strong> — {h.summary_text} {h.is_bookmarked ? '★' : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
