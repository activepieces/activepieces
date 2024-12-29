import { cn } from "../../../../../lib/utils";

interface SystemPromptProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  className?: string;
}

export const SystemPrompt = ({
  systemPrompt,
  onSystemPromptChange,
  className
}: SystemPromptProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">System Prompt</h3>
          <div className="flex items-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {systemPrompt ? `${systemPrompt.length} chars` : 'Empty'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="Enter the system prompt that defines the agent's behavior..."
          className="w-full h-48 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                   resize-none placeholder-gray-400"
          spellCheck={false}
        />
      </div>
    </div>
  );
}; 