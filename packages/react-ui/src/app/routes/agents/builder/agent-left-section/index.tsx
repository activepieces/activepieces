import { FlaskConical } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { Agent, debounce, isNil } from '@activepieces/shared';

import { AgentPromptEditor } from './agent-prompt-editor';

interface AgentLeftSectionProps {
  agent?: Agent;
}

type AgentFormValues = {
  displayName: string;
  description: string;
};

export const AgentLeftSection = ({ agent }: AgentLeftSectionProps) => {
  const [updateAgent, setTestSectionIsOpen] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.setTestSectionIsOpen,
  ]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const { setValue, getValues } = useForm<AgentFormValues>({
    defaultValues: {
      displayName: agent?.displayName ?? '',
      description: agent?.description ?? '',
    },
    values: {
      displayName: agent?.displayName ?? '',
      description: agent?.description ?? '',
    },
  });

  const debouncedUpdate = useMemo(() => {
    return debounce((updates: Partial<AgentFormValues>) => {
      if (isNil(agent)) return;
      updateAgent(updates);
    }, 500);
  }, [agent, updateAgent]);

  const handleFieldChange = (field: keyof AgentFormValues, value: string) => {
    setValue(field, value, { shouldDirty: true });
    debouncedUpdate({ [field]: value });
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
                value={getValues('displayName')}
                className="text-2xl font-semibold"
                readonly={isNil(agent)}
                onValueChange={(val) => handleFieldChange('displayName', val)}
                isEditing={isEditingName}
                setIsEditing={setIsEditingName}
              />
              <EditableTextWithPen
                value={getValues('description')}
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
                Test Agent
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
