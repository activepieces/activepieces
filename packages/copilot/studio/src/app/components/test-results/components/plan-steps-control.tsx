import { useState } from 'react';

interface PlanStep {
  type: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  description: string;
  required: boolean;
}

interface StepConfig {
  steps: PlanStep[];
}

const DEFAULT_STEPS: PlanStep[] = [
  {
    type: 'PIECE_TRIGGER',
    description: 'Start with a trigger step',
    required: true
  },
  {
    type: 'PIECE',
    description: 'Include necessary action steps',
    required: false
  }
];

interface PlanStepsControlProps {
  value: StepConfig;
  onChange: (config: StepConfig) => void;
}

export function PlanStepsControl({ value, onChange }: PlanStepsControlProps) {
  const [steps, setSteps] = useState<PlanStep[]>(value.steps || DEFAULT_STEPS);

  const addStep = () => {
    const newStep: PlanStep = {
      type: 'PIECE',
      description: 'New action step',
      required: false
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onChange({ steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (steps[index].required) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    onChange({ steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (index === 0 && direction === 'up') return;
    if (index === steps.length - 1 && direction === 'down') return;
    
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    
    setSteps(newSteps);
    onChange({ steps: newSteps });
  };

  const updateStep = (index: number, updates: Partial<PlanStep>) => {
    const newSteps = steps.map((step, i) => {
      if (i !== index) return step;
      const updatedStep = { ...step, ...updates };
      if (updates.type && !['PIECE_TRIGGER', 'PIECE', 'ROUTER'].includes(updates.type)) {
        updatedStep.type = 'PIECE';
      }
      return updatedStep as PlanStep;
    });
    setSteps(newSteps);
    onChange({ steps: newSteps });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={addStep}
          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Step
        </button>
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2.5 border rounded-lg bg-white hover:border-gray-300 transition-colors relative group"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={step.type}
                  onChange={(e) => updateStep(index, { type: e.target.value as PlanStep['type'] })}
                  disabled={step.required}
                  className="text-xs border rounded-md px-2 py-1.5 pr-8 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="PIECE_TRIGGER">Trigger</option>
                  <option value="PIECE">Action</option>
                  <option value="ROUTER">Router</option>
                </select>
                <input
                  type="text"
                  value={step.description}
                  onChange={(e) => updateStep(index, { description: e.target.value })}
                  className="flex-1 text-xs border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Step description..."
                />
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-400"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-400"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => removeStep(index)}
                disabled={step.required}
                className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-red-400"
                title="Remove step"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {step.required && (
              <div className="absolute -top-1.5 -right-1.5">
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
                  Required
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
          No steps configured. Click "Add Step" to begin.
        </div>
      )}
    </div>
  );
} 