import { TestStateData } from '@activepieces/copilot-shared';

interface ActiveScenarioCardProps {
  data: TestStateData;
}

export const ActiveScenarioCard: React.FC<ActiveScenarioCardProps> = ({
  data,
}) => {
  console.debug('Rendering ActiveScenarioCard:', { data });

  // If the scenario is not running, don't render anything
  if (!data.isRunning) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">{data.title || data.scenarioTitle}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Running Test
        </span>
      </div>
      {data.prompt && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {data.prompt}
        </p>
      )}
      {data.message && (
        <p className="text-sm text-gray-500 mt-2">
          {data.message}
        </p>
      )}
    </div>
  );
}; 