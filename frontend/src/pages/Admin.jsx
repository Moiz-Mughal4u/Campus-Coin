import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense' });

  function loadAll() {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/users').then((r) => setUsers(r.data));
    api.get('/admin/announcements').then((r) => setAnnouncements(r.data));
    api.get('/categories').then((r) => setCategories(r.data.filter((c) => c.is_default)));
  }
  useEffect(loadAll, []);

  async function toggleUser(id) {
    await api.put(`/admin/users/${id}/toggle-disable`);
    loadAll();
  }
  async function removeUser(id) {
    if (!confirm('Remove this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    loadAll();
  }
  async function addAnnouncement(e) {
    e.preventDefault();
    await api.post('/admin/announcements', announcementForm);
    setAnnouncementForm({ title: '', message: '' });
    loadAll();
  }
  async function removeAnnouncement(id) {
    await api.delete(`/admin/announcements/${id}`);
    loadAll();
  }
  async function addCategory(e) {
    e.preventDefault();
    await api.post('/admin/categories', categoryForm);
    setCategoryForm({ name: '', type: 'expense' });
    loadAll();
  }
  async function removeCategory(id) {
    await api.delete(`/admin/categories/${id}`);
    loadAll();
  }

  return (
    <div>
      <Breadcrumbs trail={['Admin Overview']} />
      <h1>Admin control panel</h1>
      <p className="help-text" style={{ marginBottom: 22 }}>System-wide oversight of students, categories and announcements.</p>

      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="panel" style={{ flex: '1 1 160px' }}><div className="help-text">Students</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700 }}>{stats.total_users}</div></div>
          <div className="panel" style={{ flex: '1 1 160px' }}><div className="help-text">Active (30d)</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700 }}>{stats.active_users}</div></div>
          <div className="panel" style={{ flex: '1 1 160px' }}><div className="help-text">Total transactions</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700 }}>{stats.total_transactions}</div></div>
          <div className="panel" style={{ flex: '2 1 260px' }}>
            <div className="help-text" style={{ marginBottom: 6 }}>Most-used categories</div>
            {stats.top_categories.map((c) => <span key={c.name} className="pill neutral" style={{ marginRight: 6 }}>{c.name} ({c.uses})</span>)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div className="panel" style={{ flex: '2 1 420px' }}>
          <div className="tab">Users</div>
          <table style={{ marginTop: 14 }}>
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.is_disabled ? <span className="pill coral">disabled</span> : <span className="pill mint">active</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn small secondary" onClick={() => toggleUser(u.user_id)}>{u.is_disabled ? 'Enable' : 'Disable'}</button>{' '}
                    <button className="btn small danger" onClick={() => removeUser(u.user_id)}>Remove</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="help-text">No students registered yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form onSubmit={addCategory} className="panel">
            <div className="tab">Default categories</div>
            <div style={{ marginTop: 12 }}>
              {categories.map((c) => (
                <div key={c.category_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}>
                  <span>{c.name} <span className="help-text">({c.type})</span></span>
                  <button type="button" className="btn small danger" onClick={() => removeCategory(c.category_id)}>×</button>
                </div>
              ))}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <input placeholder="New category name" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            </div>
            <div className="field">
              <select value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <button className="btn small" style={{ width: '100%' }}>Add default category</button>
          </form>

          <form onSubmit={addAnnouncement} className="panel">
            <div className="tab">Announcements</div>
            <div style={{ marginTop: 12, marginBottom: 10 }}>
              {announcements.map((a) => (
                <div key={a.announcement_id} style={{ borderBottom: '1px solid var(--line)', padding: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 13.5 }}>{a.title}</strong>
                    <button type="button" className="btn small danger" onClick={() => removeAnnouncement(a.announcement_id)}>×</button>
                  </div>
                  <div className="help-text">{a.message}</div>
                </div>
              ))}
            </div>
            <div className="field">
              <input placeholder="Title" required value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
            </div>
            <div className="field">
              <textarea placeholder="Message" required rows={3} value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} />
            </div>
            <button className="btn small" style={{ width: '100%' }}>Post announcement</button>
          </form>
        </div>
      </div>
    </div>
  );
}
