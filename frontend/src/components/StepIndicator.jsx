export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const stateClass = isActive ? 'active' : isCompleted ? 'completed' : '';

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step-indicator__item ${stateClass}`}>
              <div className="step-indicator__dot">
                {isCompleted ? '✓' : i + 1}
              </div>
              <span className="step-indicator__label">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-indicator__line ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
