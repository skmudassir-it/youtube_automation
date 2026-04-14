import { useRef, useState } from 'react';

export default function ImageUploader({ images, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = 5 - images.length;
    const toAdd = imageFiles.slice(0, remaining);

    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onAdd({
          file,
          preview: e.target.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="form-container" key="images">
      <h2 className="step-title">
        <span className="gradient-text">Reference Images</span>
      </h2>
      <p className="step-subtitle">
        Upload reference images to guide the AI's visual output. These help maintain character consistency.
        <span style={{ color: 'var(--text-muted)' }}> (Optional, max 5)</span>
      </p>

      {images.length < 5 && (
        <div
          id="image-upload-zone"
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
        >
          <div className="upload-zone__icon">📁</div>
          <div className="upload-zone__text">
            Drop images here or click to browse
          </div>
          <div className="upload-zone__hint">
            PNG, JPG, WebP · Max 10MB each · {5 - images.length} slots remaining
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="upload-previews">
          {images.map((img, i) => (
            <div key={i} className="upload-preview">
              <img src={img.preview} alt={img.name} />
              <button
                className="upload-preview__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                aria-label={`Remove ${img.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
