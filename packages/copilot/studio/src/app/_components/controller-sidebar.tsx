import { cn } from '../../lib/utils';
import { ThresholdControl } from '../components/test-results/components/threshold-control';
import { PlanStepsControl } from '../components/test-results/components/plan-steps-control';
import { useTestConfig } from '../TestConfigContext';

interface ControllerSidebarProps {
  className?: string;
}

export const ControllerSidebar = ({ className }: ControllerSidebarProps) => {
  console.debug('Rendering ControllerSidebar component');

  const { config, setThreshold, setCustomPrompt, setStepConfig } = useTestConfig();

  return (
    <div className={cn('w-96 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Test Configuration
            </h2>
          </div>

          <div className="space-y-6">
            {/* Threshold Control Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Relevance Threshold
                </label>
                <span className="text-xs text-gray-500">
                  Current: {(config.threshold * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ThresholdControl 
                  defaultValue={config.threshold} 
                  onChange={setThreshold}
                />
              </div>
            </div>

            {/* Custom Prompt Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">
                  Custom Planner Prompt
                </label>
                <span className="text-xs text-gray-500">
                  {config.customPrompt ? `${config.customPrompt.length} chars` : 'Optional'}
                </span>
              </div>
              <textarea
                id="customPrompt"
                value={config.customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter a custom prompt for the planner..."
                className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 placeholder-gray-400"
              />
            </div>

            {/* Plan Steps Control Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Plan Steps Configuration
                </label>
                <span className="text-xs text-gray-500">
                  {config.stepConfig.steps.length} steps defined
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg">
                <PlanStepsControl 
                  value={config.stepConfig}
                  onChange={setStepConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 