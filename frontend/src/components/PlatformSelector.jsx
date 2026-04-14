const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '▶️', ratio: '16:9', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', ratio: '9:16', color: '#00f2ea' },
  { id: 'instagram', name: 'Instagram', icon: '📸', ratio: '9:16', color: '#E4405F' },
  { id: 'x', name: 'X (Twitter)', icon: '𝕏', ratio: '1:1', color: '#ffffff' },
  { id: 'facebook', name: 'Facebook', icon: '📘', ratio: '16:9', color: '#1877F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', ratio: '1:1', color: '#0A66C2' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', ratio: '2:3', color: '#E60023' },
  { id: 'threads', name: 'Threads', icon: '🧵', ratio: '4:5', color: '#ffffff' },
];

export default function PlatformSelector({ selected, onToggle }) {
  return (
    <div className="form-container" key="platform">
      <h2 className="step-title">
        <span className="gradient-text">Select Platforms</span>
      </h2>
      <p className="step-subtitle">
        Choose where to publish your content. Each platform uses its optimal aspect ratio.
      </p>

      <div className="platform-grid">
        {PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform.id);

          return (
            <div
              key={platform.id}
              id={`platform-card-${platform.id}`}
              className={`platform-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(platform.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggle(platform.id)}
            >
              <div className="platform-card__icon">{platform.icon}</div>
              <div className="platform-card__name">{platform.name}</div>
              <div className="platform-card__ratio">{platform.ratio}</div>
              <div className="platform-card__check">
                {isSelected ? '✓' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{
          marginTop: 'var(--space-lg)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          fontSize: '0.85rem',
          color: 'var(--text-accent)',
        }}>
          ✨ {selected.length} platform{selected.length > 1 ? 's' : ''} selected — content will be optimized for each
        </div>
      )}
    </div>
  );
}
