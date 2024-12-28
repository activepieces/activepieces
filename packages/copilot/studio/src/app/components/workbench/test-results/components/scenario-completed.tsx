import { ScenarioCompletedData } from './types';

interface ScenarioCompletedProps {
  data: ScenarioCompletedData;
}

export const ScenarioCompleted: React.FC<ScenarioCompletedProps> = ({ data }) => {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Final Output:</div>
      <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
        {JSON.stringify(data.output, null, 2)}
      </pre>
    </div>
  );
}; 