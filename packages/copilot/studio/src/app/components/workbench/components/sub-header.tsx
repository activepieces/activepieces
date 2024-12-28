import { cn } from "../../../../lib/utils";

interface HeaderProps {
  isWorkbenchOpen?: boolean;
  onPromptClick?: () => void;
  onEvaluateClick?: () => void;
  activeTab: 'prompt' | 'evaluate';
}

export function Header({ 
  isWorkbenchOpen = false,
  onPromptClick,
  onEvaluateClick,
  activeTab
}: HeaderProps) {
  console.debug('Rendering SubHeader, isWorkbenchOpen:', isWorkbenchOpen);

  if (!isWorkbenchOpen) return null;

  return (
    <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-center">
      <div className="flex gap-2">
        <button
          onClick={onPromptClick}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
            activeTab === 'prompt' 
              ? "bg-gray-100 text-gray-900"
              : "text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50"
          )}
        >
          Prompt
        </button>
        <button
          onClick={onEvaluateClick}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
            activeTab === 'evaluate'
              ? "bg-gray-100 text-gray-900"
              : "text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50"
          )}
        >
          Evaluate
        </button>
      </div>
    </div>
  );
} 