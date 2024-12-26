import { cn } from '../../lib/utils';
import { ThresholdControl } from '../components/test-results/components/threshold-control';
import { CustomPromptEditor } from '../components/test-results/components/custom-prompt-editor';
import { useTestConfig } from '../TestConfigContext';

interface ControllerSidebarProps {
  className?: string;
}

export const ControllerSidebar = ({ className }: ControllerSidebarProps) => {
  console.debug('Rendering ControllerSidebar component');

  const { config, setThreshold, setCustomPrompt } = useTestConfig();

  return (
    <div className={cn('w-96 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Test Configuration
            </h2>
          </div>

          <div className="space-y-4">
            {/* Threshold Control Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Relevance Threshold
                </label>
                <span className="text-xs text-gray-500">
                  Current: {(config.threshold * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <ThresholdControl 
                  defaultValue={config.threshold} 
                  onChange={setThreshold}
                />
              </div>
            </div>

            {/* Custom Prompt Section */}
            <CustomPromptEditor
              value={config.customPrompt}
              onChange={setCustomPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 