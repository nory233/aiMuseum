import { useEffect, useState } from 'react';

function formatClock() {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

export function StatusBar() {
  const [clock, setClock] = useState(formatClock);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="status-bar">
      <span className="status-bar__time">{clock}</span>
      <div className="status-bar__badge">
        <div className="status-dot" />
        National Guide
      </div>
    </div>
  );
}

export function AppBar({ title, subtitle, onBack, light = false }) {
  return (
    <div className={`app-bar${light ? ' app-bar--light' : ''}`}>
      {onBack && (
        <button className="app-bar__back" onClick={onBack} aria-label="Go back">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
      )}
      <div className="app-bar__text">
        <div className="app-bar__title">{title}</div>
        {subtitle && <div className="app-bar__sub">{subtitle}</div>}
      </div>
    </div>
  );
}

export function AICard({ children }) {
  return (
    <div className="ai-card">
      <span className="ai-card__icon">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
      </span>
      <p className="ai-card__text">{children}</p>
    </div>
  );
}

export function ProgressBar({ pct }) {
  return (
    <div className="progress-bar-outer">
      <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-val">{value}</span>
    </div>
  );
}

export function SuccessBanner({ icon, title, sub }) {
  return (
    <div className="success-banner">
      <div className="success-banner__icon">{icon}</div>
      <div className="success-banner__title">{title}</div>
      <p className="success-banner__sub">{sub}</p>
    </div>
  );
}

export function StoneIcon({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <ellipse cx="40" cy="42" rx="28" ry="22" fill="var(--green)" opacity="0.5" />
      <ellipse cx="40" cy="40" rx="24" ry="18" fill="var(--stone)" />
      <ellipse cx="35" cy="36" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

export function StickyBottom({ children }) {
  return <div className="sticky-bottom">{children}</div>;
}
