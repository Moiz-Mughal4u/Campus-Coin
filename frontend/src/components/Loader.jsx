export default function Loader({ text = "Loading..." }) {
  return (
    <div className="page-loader">
      <div className="coin-spinner"></div>
      <div className="loader-text">{text}</div>
    </div>
  );
}