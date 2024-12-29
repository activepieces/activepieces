import { cn } from '../../../../lib/utils';
import { PromptEditor } from './components/prompt-editors';
import { useWorkbenchStore } from '../../../stores/use-workbench-store';
import { ToolsDisplay } from './components/tools-display';

interface PromptPanelProps {
  className?: string;
}

export function PromptPanel({ className }: PromptPanelProps) {
  const { selectedAgent } = useWorkbenchStore();

  if (!selectedAgent) {
    return (
      <div className={cn('w-96 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select an agent to view its configuration
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-96 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Prompt
            </h2>
            <div className="mt-2">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                {selectedAgent.systemPrompt}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Configuration
            </h2>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Model</span>
                <span className="font-medium text-gray-900">{selectedAgent.model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Temperature</span>
                <span className="font-medium text-gray-900">{selectedAgent.temperature}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Max Steps</span>
                <span className="font-medium text-gray-900">{selectedAgent.maxSteps}</span>
              </div>
            </div>
          </div>

          {selectedAgent.tools && selectedAgent.tools.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Tools
              </h2>
              <ToolsDisplay tools={selectedAgent.tools} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 