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
    if (steps[index].required) return; // Can't remove required steps
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
      // Ensure type is always a valid PlanStep type
      if (updates.type && !['PIECE_TRIGGER', 'PIECE', 'ROUTER'].includes(updates.type)) {
        updatedStep.type = 'PIECE';
      }
      return updatedStep as PlanStep;
    });
    setSteps(newSteps);
    onChange({ steps: newSteps });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Plan Steps Configuration
        </label>
        <button
          onClick={addStep}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Add Step
        </button>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 border rounded-md bg-white"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={step.type}
                  onChange={(e) => updateStep(index, { type: e.target.value as PlanStep['type'] })}
                  disabled={step.required}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="PIECE_TRIGGER">Trigger</option>
                  <option value="PIECE">Action</option>
                  <option value="ROUTER">Router</option>
                </select>
                <input
                  type="text"
                  value={step.description}
                  onChange={(e) => updateStep(index, { description: e.target.value })}
                  className="flex-1 text-sm border rounded px-2 py-1"
                  placeholder="Step description..."
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ↑
              </button>
              <button
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ↓
              </button>
              <button
                onClick={() => removeStep(index)}
                disabled={step.required}
                className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No steps configured. Click "Add Step" to begin.
        </div>
      )}
    </div>
  );
} 