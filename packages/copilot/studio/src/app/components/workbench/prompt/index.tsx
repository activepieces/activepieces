import { cn } from '../../../../lib/utils';
import { PromptEditor } from './components/prompt-editors';
import { useTestConfigStore } from '../../../stores/use-test-config-store';

interface PromptPanelProps {
  className?: string;
}

export function PromptPanel({ className }: PromptPanelProps) {
  const { config, setSystemPrompt } = useTestConfigStore();

  return (
    <div className={cn('w-96 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              System Prompt
            </h2>
          </div>

          <div className="space-y-4">
            <PromptEditor
              systemPrompt={config.systemPrompt}
              onSystemPromptChange={setSystemPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 