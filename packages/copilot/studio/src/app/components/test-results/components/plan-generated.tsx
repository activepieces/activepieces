import { PlanGeneratedData } from "@activepieces/copilot-shared";


interface PlanGeneratedProps {
  data: PlanGeneratedData;
}

interface Step {
  type: string;
  pieceName: string;
  actionOrTriggerName?: string;
  condition?: string;
}

export const PlanGenerated: React.FC<PlanGeneratedProps> = ({ data }) => {
  console.debug('Rendering PlanGenerated component with data:', data);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Generated Plan:</div>
      <div className="bg-white p-2 rounded border border-gray-200">
        <div className="font-medium text-sm">{data.plan.name}</div>
        <div className="text-xs text-gray-600 mt-1">
          {data.plan.description}
        </div>
        <div className="mt-2 space-y-2">
          {data.plan.steps.map((step: Step, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <div className="bg-blue-100 text-blue-800 px-1.5 rounded">
                {i + 1}
              </div>
              <div>
                <span className="font-medium">{step.type}</span>
                <span className="text-gray-600"> using </span>
                <span className="font-medium">{step.pieceName}</span>
                {step.actionOrTriggerName && (
                  <span className="text-gray-600">
                    {' '}
                    ({step.actionOrTriggerName})
                  </span>
                )}
                {step.condition && (
                  <div className="text-gray-600 mt-0.5">
                    Condition: {step.condition}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 