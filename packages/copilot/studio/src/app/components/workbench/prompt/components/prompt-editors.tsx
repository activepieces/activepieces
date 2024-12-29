interface PromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
}

export const PromptEditor = ({ 
  systemPrompt, 
  onSystemPromptChange 
}: PromptEditorProps) => {
  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
          System Prompt
        </label>
        <span className="text-xs text-gray-500">
          {systemPrompt ? `${systemPrompt.length} chars` : 'Optional'}
        </span>
      </div>

      {/* Prompt Textarea */}
      <textarea
        id="systemPrompt"
        value={systemPrompt}
        onChange={(e) => onSystemPromptChange(e.target.value)}
        placeholder="Enter the system prompt..."
        className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 placeholder-gray-400"
      />
    </div>
  );
}; 