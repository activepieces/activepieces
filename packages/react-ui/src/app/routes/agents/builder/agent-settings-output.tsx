import { Database, Info, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Agent,
  AgentOutputField,
  AgentOutputFieldType,
  AgentOutputType,
} from '@activepieces/shared';

import { AddFieldPopover } from './add-field-popover';
import { FieldTypeIcon } from './field-type-icon';

interface AgentSettingsOutputProps {
  onChange: (
    outputType: AgentOutputType,
    outputFields: AgentOutputField[],
  ) => void;
  agent: Agent;
}

export const AgentSettingsOutput = ({
  onChange,
  agent,
}: AgentSettingsOutputProps) => {
  const [outputFields, setOutputFields] = useState<AgentOutputField[]>(
    agent.outputFields || [],
  );
  const { setValue, watch } = useForm({
    defaultValues: {
      outputType: agent.outputType,
      outputFields: agent.outputFields,
    },
  });

  const outputType = watch('outputType');

  const addOutputField = (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => {
    const newField: AgentOutputField = {
      type,
      displayName: name,
      description: description,
    };
    const updatedFields = [...outputFields, newField];
    setOutputFields(updatedFields);
    onChange(outputType ?? AgentOutputType.NO_OUTPUT, updatedFields);
  };

  const removeOutputField = (id: string) => {
    const updatedFields = outputFields.filter(
      (field) => field.displayName !== id,
    );
    setOutputFields(updatedFields);
    onChange(outputType ?? AgentOutputType.NO_OUTPUT, updatedFields);
  };

  const handleOutputTypeChange = (checked: boolean) => {
    const value = checked
      ? AgentOutputType.STRUCTURED_OUTPUT
      : AgentOutputType.NO_OUTPUT;
    setValue('outputType', value);
    onChange(value, outputFields);
  };

  return (
    <div className="space-y-6">
      <Separator className="my-2" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            <span>Structured Output</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure how your agent should structure its output.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={outputType === AgentOutputType.STRUCTURED_OUTPUT}
            onCheckedChange={handleOutputTypeChange}
            aria-label="Toggle output structure"
          />
        </div>
      </div>

      {outputType === AgentOutputType.STRUCTURED_OUTPUT && (
        <div className="space-y-4">
          {outputFields.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {outputFields.map((field) => (
                    <div
                      key={field.displayName}
                      className="flex items-center justify-between"
                    >
                      <div className="grid grid-cols-12 gap-2 w-full items-center">
                        <div className="col-span-1 flex items-center justify-center h-full">
                          <FieldTypeIcon
                            type={field.type}
                            className="h-5 w-5"
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
                            onClick={() => removeOutputField(field.displayName)}
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
          )}
          <AddFieldPopover onAddField={addOutputField} />
        </div>
      )}
    </div>
  );
};
