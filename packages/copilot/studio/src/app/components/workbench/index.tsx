import { useState } from 'react';
import { Header } from './components/sub-header';
import { PromptPanel } from './prompt';
import { TestResults } from './test-results';
import { AgentDrawer } from './agents/components';
import { useWorkbenchStore } from '../../stores/use-workbench-store';

export const Workbench = () => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'evaluate'>('prompt');
  const { selectedAgentName, setSelectedAgent } = useWorkbenchStore();

  const handlePromptClick = () => {
    setActiveTab('prompt');
  };

  const handleEvaluateClick = () => {
    setActiveTab('evaluate');
  };

  const handleSelectAgent = (agentName: string) => {
    setSelectedAgent(agentName);
  };

  return (
    <>
      <Header 
        isWorkbenchOpen={true}
        onPromptClick={handlePromptClick}
        onEvaluateClick={handleEvaluateClick}
        activeTab={activeTab}
      />
      <AgentDrawer 
        onSelectAgent={handleSelectAgent}
        selectedAgent={selectedAgentName || undefined}
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