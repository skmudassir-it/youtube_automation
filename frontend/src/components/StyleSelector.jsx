const STYLES = [
  {
    id: 'hyperrealistic',
    name: 'Hyperrealistic',
    desc: 'Photographic, cinematic quality',
    emoji: '📷',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  },
  {
    id: 'anime',
    name: 'Anime',
    desc: 'Japanese animation style',
    emoji: '⛩️',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24, #d63031)',
  },
  {
    id: '3d-cartoon',
    name: '3D Cartoon',
    desc: 'Pixar-style 3D rendering',
    emoji: '🎨',
    gradient: 'linear-gradient(135deg, #0984e3, #6c5ce7, #a29bfe)',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    desc: 'Soft painted aesthetics',
    emoji: '🖌️',
    gradient: 'linear-gradient(135deg, #55efc4, #81ecec, #74b9ff)',
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    desc: 'Bold lines, halftone dots',
    emoji: '💥',
    gradient: 'linear-gradient(135deg, #fdcb6e, #e17055, #d63031)',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    desc: 'Neon-lit futuristic world',
    emoji: '🌃',
    gradient: 'linear-gradient(135deg, #6c5ce7, #e84393, #fd79a8)',
  },
  {
    id: 'studio-ghibli',
    name: 'Studio Ghibli',
    desc: 'Whimsical, pastoral beauty',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #00b894, #55efc4, #81ecec)',
  },
];

export default function StyleSelector({ selected, onSelect }) {
  return (
    <div className="form-container" key="style">
      <h2 className="step-title">
        <span className="gradient-text">Choose Visual Style</span>
      </h2>
      <p className="step-subtitle">
        Select the artistic style for your video. This defines how your scenes will look.
      </p>

      <div className="style-grid">
        {STYLES.map((style) => (
          <div
            key={style.id}
            id={`style-card-${style.id}`}
            className={`style-card gradient-border ${selected === style.id ? 'selected active' : ''}`}
            onClick={() => onSelect(style.id)}
            role="button"
            tabIndex={0}
            aria-label={`Select ${style.name} style`}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(style.id)}
          >
            <div
              className="style-card__preview"
              style={{ background: style.gradient }}
            >
              <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                {style.emoji}
              </span>
            </div>

            <div className="style-card__info">
              <div className="style-card__name">{style.name}</div>
              <div className="style-card__desc">{style.desc}</div>
            </div>

            <div className="style-card__check">✓</div>
          </div>
        ))}
      </div>
    </div>
  );
}
