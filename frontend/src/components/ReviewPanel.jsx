const STYLE_LABELS = {
  'hyperrealistic': 'Hyperrealistic',
  'anime': 'Anime',
  '3d-cartoon': '3D Cartoon',
  'watercolor': 'Watercolor',
  'comic-book': 'Comic Book',
  'cyberpunk': 'Cyberpunk',
  'studio-ghibli': 'Studio Ghibli',
};

const PLATFORM_LABELS = {
  youtube: 'YouTube',   tiktok: 'TikTok',
  instagram: 'Instagram', x: 'X (Twitter)',
  facebook: 'Facebook', linkedin: 'LinkedIn',
  pinterest: 'Pinterest', threads: 'Threads',
};

export default function ReviewPanel({ storyPrompt, visualStyle, platforms, images }) {
  return (
    <div className="form-container" key="review">
      <h2 className="step-title">
        <span className="gradient-text">Review & Generate</span>
      </h2>
      <p className="step-subtitle">
        Double-check your settings before launching the AI content pipeline.
      </p>

      <div className="review-grid">
        <div className="review-item">
          <div className="review-item__label">Story Prompt</div>
          <div className="review-item__value" style={{ whiteSpace: 'pre-wrap' }}>
            {storyPrompt || '—'}
          </div>
        </div>

        <div className="review-item">
          <div className="review-item__label">Visual Style</div>
          <div className="review-item__value">
            {STYLE_LABELS[visualStyle] || '—'}
          </div>
        </div>

        <div className="review-item">
          <div className="review-item__label">Target Platforms</div>
          <div className="review-item__tags">
            {platforms.length > 0 ? platforms.map(p => (
              <span key={p} className="review-tag">
                {PLATFORM_LABELS[p] || p}
              </span>
            )) : <span style={{ color: 'var(--text-muted)' }}>None selected</span>}
          </div>
        </div>

        <div className="review-item">
          <div className="review-item__label">Reference Images</div>
          {images.length > 0 ? (
            <div className="upload-previews" style={{ marginTop: '8px' }}>
              {images.map((img, i) => (
                <div key={i} className="upload-preview" style={{ width: '80px', height: '80px' }}>
                  <img src={img.preview} alt={img.name} />
                </div>
              ))}
            </div>
          ) : (
            <div className="review-item__value" style={{ color: 'var(--text-muted)' }}>
              No reference images (AI will create freely)
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: 'var(--space-xl)',
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(99, 102, 241, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          The pipeline will generate <strong style={{ color: 'var(--text-primary)' }}>3 scenes</strong> with images, videos, narration, and subtitles
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Estimated time: 5–15 minutes depending on scene complexity
        </p>
      </div>
    </div>
  );
}
