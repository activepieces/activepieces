import { PlanGeneratedData } from "@activepieces/copilot-shared";
import { FC } from 'react';

// Types
interface PlanGeneratedProps {
  data: PlanGeneratedData;
}

interface Step {
  type: string;
  pieceName: string;
  actionOrTriggerName?: string;
  condition?: string;
}

// Sub-components
const StepNumber: FC<{ number: number }> = ({ number }) => (
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0">
    {number}
  </div>
);

const StepType: FC<{ type: string }> = ({ type }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trigger': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'action': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'branch': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <span className={`px-1.5 py-0.5 text-[11px] font-medium rounded border ${getTypeColor(type)}`}>
      {type}
    </span>
  );
};

const StepCondition: FC<{ condition: string }> = ({ condition }) => (
  condition && (
    <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
      <div className="w-1 h-1 rounded-full bg-gray-400"/>
      <span className="font-medium">If:</span> {condition}
    </div>
  )
);

const StepDetails: FC<{ step: Step }> = ({ step }) => (
  <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 flex-wrap">
      <StepType type={step.type} />
      <span className="font-medium text-[12px] text-blue-600 truncate">
        {step.pieceName}
      </span>
      {step.actionOrTriggerName && (
        <>
          <div className="w-1 h-1 rounded-full bg-gray-300"/>
          <span className="text-[11px] text-gray-600 truncate">
            {step.actionOrTriggerName}
          </span>
        </>
      )}
    </div>
    <StepCondition condition={step.condition || ''} />
  </div>
);

const PlanStep: FC<{ step: Step; index: number }> = ({ step, index }) => (
  <div 
    className="flex items-start gap-2 py-2 px-3 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-colors duration-150" 
    data-testid={`plan-step-${index}`}
  >
    <StepNumber number={index + 1} />
    <StepDetails step={step} />
  </div>
);

const PlanHeader: FC<{ name: string; description: string; stepsCount: number }> = ({ 
  name, 
  description,
  stepsCount 
}) => (
  <div className="flex items-start justify-between border-b border-gray-200 pb-2 mb-3">
    <div>
      <div className="font-medium text-sm text-gray-900" data-testid="plan-name">
        {name}
      </div>
      <div className="text-xs text-gray-500 mt-0.5" data-testid="plan-description">
        {description}
      </div>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
      <span className="text-xs font-medium text-gray-600">
        {stepsCount} steps
      </span>
    </div>
  </div>
);

export const PlanGenerated: FC<PlanGeneratedProps> = ({ data }) => {

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium text-gray-700 uppercase tracking-wider">Plan Overview</div>
      </div>
      <div 
        className="bg-white p-3 rounded-lg border border-gray-200" 
        data-testid="plan-container"
      >
        <PlanHeader 
          name={data.plan.name} 
          description={data.plan.description}
          stepsCount={data.plan.steps.length}
        />
        <div className="space-y-2">
          {data.plan.steps.map((step: Step, i: number) => (
            <PlanStep 
              key={i} 
              step={step} 
              index={i} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 