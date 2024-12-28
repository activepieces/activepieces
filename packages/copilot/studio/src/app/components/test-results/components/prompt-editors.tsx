import { useState } from 'react';
import { CustomPromptEditor } from './custom-prompt-editor';

interface PromptEditorsProps {
  plannerPrompt: string;
  stepPrompt: string;
  onPlannerPromptChange: (value: string) => void;
  onStepPromptChange: (value: string) => void;
}

type TabType = 'planner' | 'step';

export const PromptEditors = ({ 
  plannerPrompt, 
  stepPrompt, 
  onPlannerPromptChange, 
  onStepPromptChange 
}: PromptEditorsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('planner');

  const getTabClasses = (tab: TabType) => {
    const baseClasses = "whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium";
    return tab === activeTab
      ? `border-blue-500 text-blue-600 ${baseClasses}`
      : `border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 ${baseClasses}`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={getTabClasses('planner')}
          >
            Planner Prompt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('step')}
            className={getTabClasses('step')}
          >
            Step Generation Prompt
          </button>
        </nav>
      </div>

      {/* Editors */}
      <div>
        {activeTab === 'planner' ? (
          <CustomPromptEditor
            type="planner"
            value={plannerPrompt}
            onChange={onPlannerPromptChange}
          />
        ) : (
          <CustomPromptEditor
            type="step"
            value={stepPrompt}
            onChange={onStepPromptChange}
          />
        )}
      </div>
    </div>
  );
}; 