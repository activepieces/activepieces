import { t } from 'i18next';
import { X } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AgentOutputFieldType, AgentOutputField } from '@activepieces/shared';

import { AddFieldPopover } from './add-field-popover';
import { FieldTypeIcon } from './field-type-icon';

const PLACEHOLDER_FIELD: AgentOutputField = {
  displayName: '__placeholder__',
  description: '',
  type: AgentOutputFieldType.TEXT,
};

export const AgentStructuredOutput = ({
  structuredOutputField,
}: {
  structuredOutputField: ControllerRenderProps;
}) => {
  const value = structuredOutputField.value;
  const outputFields = Array.isArray(value)
    ? (value as AgentOutputField[])
    : [];

  const visibleFields = outputFields.filter(
    (f) => f.displayName !== PLACEHOLDER_FIELD.displayName,
  );

  const isStructuredOutputEnabled = outputFields.some(
    (f) => f.displayName === PLACEHOLDER_FIELD.displayName,
  );

  const handleToggleStructuredOutput = (enabled: boolean) => {
    if (enabled) {
      structuredOutputField.onChange([PLACEHOLDER_FIELD]);
    } else {
      structuredOutputField.onChange([]);
    }
  };

  const handleAddField = (
    type: AgentOutputFieldType,
    name: string,
    description: string,
  ) => {
    const newField = { displayName: name, description, type };
    structuredOutputField.onChange([...(outputFields ?? []), newField]);
  };

  const handleRemoveField = (displayName: string) => {
    const newFields = outputFields.filter((f) => f.displayName !== displayName);
    structuredOutputField.onChange(newFields);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">{t('Structured Output')}</h2>
        <Switch
          checked={isStructuredOutputEnabled}
          onCheckedChange={handleToggleStructuredOutput}
          size="sm"
        />
      </div>

      {isStructuredOutputEnabled && (
        <div className="flex flex-col gap-2 mt-4">
          {visibleFields.length > 0 ? (
            <Card>
              <CardContent className="px-2 py-2">
                <div className="flex flex-col gap-3">
                  {visibleFields.map((field, idx) => (
                    <div
                      key={field.displayName + field.type + idx}
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
              {t('No structured output fields yet.')}
            </div>
          )}
          <AddFieldPopover onAddField={handleAddField} />
        </div>
      )}
    </div>
  );
};
