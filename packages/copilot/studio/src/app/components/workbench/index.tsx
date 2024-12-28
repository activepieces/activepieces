import { useState } from 'react';
import { Header } from './components/sub-header';
import { PromptPanel } from './prompt';
import { TestResults } from './test-results';
import { Scenarios } from './scenarios';

interface WorkbenchProps {
  isOpen: boolean;
}

export const Workbench = ({ isOpen }: WorkbenchProps) => {
  console.debug('Rendering Workbench');
  const [activeTab, setActiveTab] = useState<'prompt' | 'evaluate'>('prompt');

  const handlePromptClick = () => {
    setActiveTab('prompt');
  };

  const handleEvaluateClick = () => {
    setActiveTab('evaluate');
  };

  if (!isOpen) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select Workbench or Studio to get started</p>
      </div>
    );
  }

  return (
    <>
      <Header 
        isWorkbenchOpen={isOpen}
        onPromptClick={handlePromptClick}
        onEvaluateClick={handleEvaluateClick}
        activeTab={activeTab}
      />
      {activeTab === 'prompt' ? (
        <div className="flex-1 flex overflow-hidden">
          <PromptPanel />
          <TestResults />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Scenarios />
          <TestResults />
        </div>
      )}
    </>
  );
}; 