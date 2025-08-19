import { t } from 'i18next';
import { Database, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { AgentOutputType, AgentOutputFieldType } from '@activepieces/shared';

import { AddFieldPopover } from './add-field-popover';
import { FieldTypeIcon } from './field-type-icon';

export const AgentStructuredOutput = () => {
  const { agent, updateAgent } = useBuilderAgentState((state) => ({
    agent: state.agent,
    updateAgent: state.updateAgent,
  }));

  const isStructuredOutputEnabled =
    agent.outputType === AgentOutputType.STRUCTURED_OUTPUT;

  const handleToggleStructuredOutput = (enabled: boolean) => {
    updateAgent({
      outputType: enabled
        ? AgentOutputType.STRUCTURED_OUTPUT
        : AgentOutputType.NO_OUTPUT,
      outputFields: enabled ? [] : undefined,
    });
  };

  const handleAddField = (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => {
    const newField = {
      displayName: name,
      description,
      type,
    };
    const currentFields = agent.outputFields || [];
    updateAgent({
      outputFields: [...currentFields, newField],
    });
  };

  const handleRemoveField = (displayName: string) => {
    const currentFields = agent.outputFields || [];
    updateAgent({
      outputFields: currentFields.filter((f) => f.displayName !== displayName),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-medium flex items-center gap-2">
          <Database className="w-4 h-4" />
          {t('Structured Output')}
        </h2>
        <div className="flex items-center gap-2">
          <Switch
            checked={isStructuredOutputEnabled}
            onCheckedChange={handleToggleStructuredOutput}
            size="sm"
          />
        </div>
      </div>
      {isStructuredOutputEnabled && (
        <div className="flex flex-col gap-2 mt-4">
          {agent.outputFields && agent.outputFields.length > 0 ? (
            <Card>
              <CardContent className="px-2 py-2">
                <div className="flex flex-col gap-3">
                  {agent.outputFields.map((field, idx) => (
                    <div
                      key={
                        field.displayName + field.type + field.description + idx
                      }
                      className="flex items-center justify-between"
                    >
                      <div className="grid grid-cols-12 gap-2 w-full items-center">
                        <div className="col-span-1 flex items-center justify-center h-full">
                          <FieldTypeIcon
                            type={field.type}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="col-span-10 flex flex-col justify-center">
                          <span className="font-medium text-sm">
                            {field.displayName}
                          </span>
                          {field.description && (
                            <span className="text-xs text-muted-foreground">
                              {field.description}
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField(field.displayName)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground text-sm">
              No structured output fields yet.
            </div>
          )}
          <AddFieldPopover onAddField={handleAddField} />
        </div>
      )}
    </div>
  );
};
