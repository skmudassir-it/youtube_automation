const SUGGESTIONS = [
  "A samurai warrior discovers a magical portal in ancient Kyoto...",
  "An astronaut befriends an alien species on a distant planet...",
  "A street artist's graffiti comes to life at midnight...",
  "A dragon protects a hidden village from an approaching army...",
  "A musician's melody can heal any wound or sorrow...",
];

export default function StoryPrompt({ value, onChange }) {
  const maxChars = 2000;

  return (
    <div className="form-container" key="story">
      <h2 className="step-title">
        <span className="gradient-text">Tell Your Story</span>
      </h2>
      <p className="step-subtitle">
        Describe the video story you want to create. Be vivid and specific — the AI will generate scenes, visuals, and narration from your prompt.
      </p>

      <textarea
        id="story-prompt-input"
        className="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        placeholder="Once upon a time, in a world where dreams become reality..."
        maxLength={maxChars}
        autoFocus
      />

      <div className="prompt-meta">
        <span>{value.length} / {maxChars}</span>
        <span>min 20 characters</span>
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          ✨ Need inspiration? Try one:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="btn-ghost"
              onClick={() => onChange(s)}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent-mid)';
                e.target.style.color = 'var(--text-accent)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              {s.slice(0, 50)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
