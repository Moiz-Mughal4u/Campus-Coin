export default function Breadcrumbs({ trail }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 6 }}>
      {trail.map((t, i) => (
        <span key={t}>
          {i > 0 && <span style={{ margin: '0 6px' }}>/</span>}
          {t}
        </span>
      ))}
    </div>
  );
}
