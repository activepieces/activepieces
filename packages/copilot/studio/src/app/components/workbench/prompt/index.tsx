import { cn } from '../../../../lib/utils';
import { ThresholdControl } from './components/threshold-control';
import { PromptEditors } from './components/prompt-editors';
import { useTestConfigStore } from '../../../stores/use-test-config-store';

interface PromptPanelProps {
  className?: string;
}

export function PromptPanel({ className }: PromptPanelProps) {
  
  const { config, setThreshold, setPlannerPrompt, setStepPrompt } = useTestConfigStore()

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

            {/* Prompt Editors Section */}
            <PromptEditors
              plannerPrompt={config.plannerPrompt}
              stepPrompt={config.stepPrompt}
              onPlannerPromptChange={setPlannerPrompt}
              onStepPromptChange={setStepPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 