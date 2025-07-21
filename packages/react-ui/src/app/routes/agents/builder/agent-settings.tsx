import { t } from 'i18next';
import { CheckIcon, Wand } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';

import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import { Form, FormControl, FormField } from '@/components/ui/form';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Agent,
  AgentOutputField,
  AgentOutputType,
  debounce,
  isNil,
} from '@activepieces/shared';

import { agentHooks } from '../../../../features/agents/lib/agent-hooks';
import { UseAgentButton } from '../../../../features/agents/use-agent-button';
import { McpToolsSection } from '../../mcp-servers/id/mcp-config/mcp-tools-section';

import { AgentSettingsOutput } from './agent-settings-output';

interface AgentSettingsProps {
  agent?: Agent;
  refetch: () => void;
  onChange?: (agent: Agent) => void;
  hideUseAgentButton?: boolean;
}

interface AgentFormValues {
  systemPrompt: string;
  displayName: string;
  description: string;
  outputType: AgentOutputType | undefined;
  outputFields: AgentOutputField[] | undefined;
}

export const AgentSettings = ({
  agent,
  refetch,
  onChange,
  hideUseAgentButton,
}: AgentSettingsProps) => {
  const form = useForm<AgentFormValues>({
    defaultValues: {
      systemPrompt: '',
      displayName: '',
      description: '',
      outputType: undefined,
      outputFields: undefined,
    },
    mode: 'all',
    reValidateMode: 'onChange',
  });

  const { setValue, getValues } = form;
  const updateAgentMutation = agentHooks.useUpdate();
  const [isSaving, setIsSaving] = useState(false);
  const hasSavedRef = useRef(false);
  const debouncedUpdate = useMemo(() => {
    return debounce((formData: AgentFormValues) => {
      if (isNil(agent)) return;
      updateAgentMutation.mutate(
        {
          id: agent.id,
          request: formData,
        },
        {
          onSuccess: () => {
            refetch();
            onChange?.(agent);
            setIsSaving(false);
          },
        },
      );
    }, 500);
  }, [refetch, updateAgentMutation, onChange]);

  const handleChange = () => {
    hasSavedRef.current = true;
    setIsSaving(true);
    debouncedUpdate(getValues());
  };

  useEffect(() => {
    if (agent) {
      setValue('systemPrompt', agent.systemPrompt);
      setValue('displayName', agent.displayName);
      setValue('description', agent.description);
      setValue('outputType', agent.outputType);
      setValue('outputFields', agent.outputFields);
    }
  }, [agent?.id, setValue]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <Form {...form}>
      <div className="flex flex-1 h-full">
        <div className="w-full px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <ImageWithFallback
                src={agent?.profilePictureUrl}
                alt="Agent avatar"
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
            <div className="flex justify-between w-full">
              <div className="flex flex-col flex-1">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormControl>
                      <EditableTextWithPen
                        value={field.value}
                        className="text-2xl font-semibold"
                        readonly={isNil(agent)}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleChange();
                        }}
                        isEditing={isEditingName}
                        setIsEditing={setIsEditingName}
                      />
                    </FormControl>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormControl>
                      <EditableTextWithPen
                        value={field.value}
                        className="text-sm text-muted-foreground mt-1 max-w-[400px]"
                        readonly={isNil(agent)}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleChange();
                        }}
                        isEditing={isEditingDescription}
                        setIsEditing={setIsEditingDescription}
                      />
                    </FormControl>
                  )}
                />
              </div>
              <div className="flex items-center justify-center flex-col gap-2">
                {!isNil(agent) && !hideUseAgentButton && (
                  <UseAgentButton agentId={agent.id} />
                )}
                <SavingIndicator
                  isSaving={isSaving}
                  hasSaved={hasSavedRef.current}
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-lg">
                <Wand className="w-4 h-4" />
                <span>{t('Instructions')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('Define how your agent should behave and respond to tasks.')}
              </p>
            </div>
          </div>
          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormControl>
                <Textarea
                  id="system-prompt"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleChange();
                  }}
                  placeholder="You are a helpful assistant that specializes in scheduling meetings."
                  className="min-h-[100px] resize-none w-full mt-4"
                  disabled={isNil(agent)}
                  maxRows={10}
                  minRows={5}
                />
              </FormControl>
            )}
          />

          {!isNil(agent) && !isNil(agent.mcpId) && (
            <div className="mt-6">
              <McpToolsSection mcpId={agent.mcpId} />
              <AgentSettingsOutput
                onChange={(outputType, outputFields) => {
                  setValue('outputType', outputType);
                  setValue('outputFields', outputFields);
                  handleChange();
                }}
                agent={agent}
              />
            </div>
          )}
        </div>
      </div>
    </Form>
  );
};

const SavingIndicator = ({
  isSaving,
  hasSaved,
}: {
  isSaving: boolean;
  hasSaved: boolean;
}) => {
  if (!hasSaved) {
    return <div className="size-4"></div>;
  }

  if (isSaving) {
    return (
      <div className="flex px-2 gap-2 text-sm w-full animate-fade">
        <LoadingSpinner className="size-4"></LoadingSpinner>
        <span>{t('Saving') + '...'}</span>
      </div>
    );
  }
  return (
    <div className="flex px-2 w-full items-center gap-2 text-sm  animate-fade">
      <CheckIcon className="size-4"></CheckIcon>
      <span>{t('Saved')}</span>
    </div>
  );
};
