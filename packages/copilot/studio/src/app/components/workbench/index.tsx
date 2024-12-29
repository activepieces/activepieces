import { useState } from 'react';
import { Header } from './components/sub-header';
import { PromptPanel } from './prompt';
import { TestResults } from './test-results';

export const Workbench = () => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'evaluate'>('prompt');

  const handlePromptClick = () => {
    setActiveTab('prompt');
  };

  const handleEvaluateClick = () => {
    setActiveTab('evaluate');
  };

  return (
    <>
      <Header 
        isWorkbenchOpen={true}
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

          <TestResults />
        </div>
      )}
    </>
  );
}; 