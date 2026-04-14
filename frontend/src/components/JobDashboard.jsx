import { useState, useEffect } from 'react';

const PIPELINE_STAGES = [
  { key: 'generating_scenes', name: 'Scene Generation', icon: '📝', desc: 'AI is crafting your story scenes' },
  { key: 'generating_images', name: 'Image Creation', icon: '🎨', desc: 'Generating styled images for each scene' },
  { key: 'generating_videos', name: 'Video Clips', icon: '🎬', desc: 'Converting images to video clips' },
  { key: 'generating_audio', name: 'Voice & Audio', icon: '🎙️', desc: 'Creating voiceover narration' },
  { key: 'merging', name: 'Video Merge', icon: '🔗', desc: 'Merging clips with audio tracks' },
  { key: 'adding_subtitles', name: 'Subtitles', icon: '💬', desc: 'Adding animated subtitles' },
  { key: 'generating_metadata', name: 'Metadata', icon: '📋', desc: 'Generating titles, descriptions & tags' },
  { key: 'publishing', name: 'Publishing', icon: '📤', desc: 'Posting to your social platforms' },
];

const API_BASE = 'http://localhost:3001';

export default function JobDashboard({ jobId, onNewJob }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch job status');

        const data = await res.json();
        setJob(data);

        if (data.status === 'completed' || data.status === 'failed') {
          return; // Stop polling
        }
      } catch (err) {
        setError(err.message);
        return;
      }

      // Continue polling
      setTimeout(poll, 3000);
    };

    poll();
  }, [jobId]);

  if (error) {
    return (
      <div className="dashboard">
        <div className="output-section" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '16px' }}>❌</p>
          <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-secondary" onClick={onNewJob}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="dashboard" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="pipeline-step__spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Connecting to pipeline...</p>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === job.status);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="step-title" style={{ fontSize: '2rem' }}>
          {job.status === 'completed' ? (
            <span className="gradient-text">Content Ready! 🎉</span>
          ) : job.status === 'failed' ? (
            <span style={{ color: 'var(--color-error)' }}>Pipeline Failed ❌</span>
          ) : (
            <span className="gradient-text">Creating Your Content...</span>
          )}
        </h2>
        <p className="step-subtitle">{job.statusMessage}</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${job.progress || 0}%` }}
          />
        </div>
        <div className="progress-info">
          <span className="progress-info__status">
            {job.status === 'completed' ? '✓ Complete' : job.status === 'failed' ? '✕ Failed' : 'Processing...'}
          </span>
          <span className="progress-info__percent">{Math.round(job.progress || 0)}%</span>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="pipeline-steps">
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = stage.key === job.status;
          const isCompleted = currentStageIndex > i || job.status === 'completed';
          const stateClass = isActive ? 'active' : isCompleted ? 'completed' : '';

          return (
            <div key={stage.key} className={`pipeline-step ${stateClass}`}>
              <div className="pipeline-step__icon">{stage.icon}</div>
              <div className="pipeline-step__info">
                <div className="pipeline-step__name">{stage.name}</div>
                <div className="pipeline-step__status">
                  {isCompleted ? '✓ Done' : isActive ? stage.desc : 'Pending'}
                </div>
              </div>
              {isActive && <div className="pipeline-step__spinner" />}
              {isCompleted && (
                <span style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Output Section — Shows when completed */}
      {job.status === 'completed' && (
        <div className="output-section">
          <h3 className="output-section__title">🎬 Your Content</h3>

          {/* Video Preview */}
          {job.finalVideoUrl && (
            <div className="output-video">
              <video controls src={job.finalVideoUrl} style={{ maxHeight: '400px' }}>
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Metadata for first platform */}
          {job.metadata && Object.keys(job.metadata).length > 0 && (
            <div className="output-grid" style={{ marginTop: 'var(--space-lg)' }}>
              {Object.entries(job.metadata).map(([platform, meta]) => (
                <div key={platform} className="output-meta">
                  <div className="output-meta__label">{platform} — Title</div>
                  <div className="output-meta__value">{meta.title}</div>
                  <div className="output-meta__label" style={{ marginTop: '12px' }}>Description</div>
                  <div className="output-meta__value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {meta.description}
                  </div>
                  {meta.tags && (
                    <>
                      <div className="output-meta__label" style={{ marginTop: '12px' }}>Tags</div>
                      <div className="review-item__tags" style={{ marginTop: '4px' }}>
                        {meta.tags.map((tag, i) => (
                          <span key={i} className="review-tag">{tag}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Publish Results */}
          {job.publishResults && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div className="output-meta__label" style={{ marginBottom: '8px' }}>Publishing Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(job.publishResults).map(([platform, result]) => (
                  <span
                    key={platform}
                    className={`status-badge ${result.status === 'scheduled' ? 'completed' : result.status === 'skipped' ? 'processing' : 'failed'}`}
                  >
                    {platform}: {result.status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="download-section">
            {job.finalVideoUrl && (
              <a
                href={`${API_BASE}/api/jobs/${jobId}/download`}
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                id="download-button"
              >
                ⬇ Download Video
              </a>
            )}
            <button className="btn btn-secondary" onClick={onNewJob} id="new-job-button">
              ＋ Create Another
            </button>
          </div>
        </div>
      )}

      {/* Failed State */}
      {job.status === 'failed' && (
        <div className="output-section" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>
            {job.error || 'An unexpected error occurred'}
          </p>
          <button className="btn btn-secondary" onClick={onNewJob}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
