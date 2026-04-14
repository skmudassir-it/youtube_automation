import { useState } from 'react';
import StepIndicator from './components/StepIndicator';
import StoryPrompt from './components/StoryPrompt';
import StyleSelector from './components/StyleSelector';
import PlatformSelector from './components/PlatformSelector';
import ImageUploader from './components/ImageUploader';
import ReviewPanel from './components/ReviewPanel';
import JobDashboard from './components/JobDashboard';

const STEPS = ['Story', 'Style', 'Platforms', 'Images', 'Review'];
const API_BASE = 'http://localhost:3001';

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [videoLength, setVideoLength] = useState(15);
  const [visualStyle, setVisualStyle] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [images, setImages] = useState([]);

  // Job state
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Platform toggle
  const togglePlatform = (id) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Image handlers
  const addImage = (img) => {
    setImages(prev => [...prev, img].slice(0, 5));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return storyPrompt.length >= 20;
      case 1: return !!visualStyle;
      case 2: return platforms.length > 0;
      case 3: return true; // Images are optional
      case 4: return true;
      default: return false;
    }
  };

  // Submit job
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('storyPrompt', storyPrompt);
      formData.append('videoLength', videoLength);
      formData.append('visualStyle', visualStyle);
      formData.append('platforms', JSON.stringify(platforms));

      images.forEach((img) => {
        formData.append('images', img.file);
      });

      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create job');
      }

      const data = await res.json();
      setJobId(data.jobId);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewJob = () => {
    setJobId(null);
    setCurrentStep(0);
    setStoryPrompt('');
    setVideoLength(15);
    setVisualStyle('');
    setPlatforms([]);
    setImages([]);
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StoryPrompt value={storyPrompt} onChange={setStoryPrompt} length={videoLength} onLengthChange={setVideoLength} />;
      case 1:
        return <StyleSelector selected={visualStyle} onSelect={setVisualStyle} />;
      case 2:
        return <PlatformSelector selected={platforms} onToggle={togglePlatform} />;
      case 3:
        return <ImageUploader images={images} onAdd={addImage} onRemove={removeImage} />;
      case 4:
        return (
          <ReviewPanel
            storyPrompt={storyPrompt}
            visualStyle={visualStyle}
            platforms={platforms}
            images={images}
          />
        );
      default:
        return null;
    }
  };

  // If a job is active, show the dashboard
  if (jobId) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header__tag">⚡ Pipeline Active</div>
          <h1 className="app-header__title">
            <span className="gradient-text">AI Content Studio</span>
          </h1>
        </header>
        <JobDashboard jobId={jobId} onNewJob={handleNewJob} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__tag">✦ AI-Powered</div>
        <h1 className="app-header__title">
          <span className="gradient-text">AI Content Studio</span>
        </h1>
        <p className="app-header__sub">
          Transform your stories into stunning social media videos with AI-generated visuals, voiceovers, and subtitles
        </p>
      </header>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div key={currentStep}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="nav-buttons" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
          id="btn-back"
        >
          ← Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
            id="btn-next"
          >
            Continue →
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            id="btn-generate"
            style={{ minWidth: '180px' }}
          >
            {submitting ? (
              <>
                <span className="pipeline-step__spinner" style={{ width: 16, height: 16 }} />
                Launching...
              </>
            ) : (
              '🚀 Generate Content'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
