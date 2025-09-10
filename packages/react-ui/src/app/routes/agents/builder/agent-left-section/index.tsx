import { t } from 'i18next';
import { FlaskConical } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { isNil } from '@activepieces/shared';

import { AgentPromptEditor } from './agent-prompt-editor';

type AgentFormValues = {
  displayName: string;
  description: string;
};

export const AgentLeftSection = () => {
  const [updateAgent, agent, setTestSectionIsOpen] = useBuilderAgentState(
    (state) => [state.updateAgent, state.agent, state.setTestSectionIsOpen],
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleFieldChange = (field: keyof AgentFormValues, value: string) => {
    updateAgent({ [field]: value });
  };

  return (
    <div className="w-full p-4 md:w-2/3">
      <div className="w-full bg-background rounded-lg flex flex-col h-full border px-4 py-4">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <ImageWithFallback
              src={agent?.profilePictureUrl}
              alt="Agent avatar"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <div className="flex justify-between w-full items-start">
            <div className="flex flex-col flex-1">
              <EditableTextWithPen
                value={agent.displayName}
                className="text-2xl font-semibold"
                readonly={isNil(agent)}
                onValueChange={(val) => handleFieldChange('displayName', val)}
                isEditing={isEditingName}
                setIsEditing={setIsEditingName}
              />
              <EditableTextWithPen
                value={agent.description ?? ''}
                className="text-sm text-muted-foreground mt-1 max-w-[400px]"
                readonly={isNil(agent)}
                onValueChange={(val) => handleFieldChange('description', val)}
                isEditing={isEditingDescription}
                setIsEditing={setIsEditingDescription}
              />
            </div>
            <div className="ml-4 flex items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTestSectionIsOpen(true)}
                className="ml-auto flex items-center gap-2"
                type="button"
              >
                <FlaskConical className="w-4 h-4" />
                {t('Test Agent')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1 flex flex-col min-h-0">
          <AgentPromptEditor />
        </div>
      </div>
    </div>
  );
};
