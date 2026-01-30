import { t } from 'i18next';
import { useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PropertyType,
  PiecePropertyMap,
  PieceProperty,
} from '@activepieces/pieces-framework';
import { FlowTrigger } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { testStepHooks } from '../utils/test-step-hooks';

type FunctionCallTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestingSuccess: () => void;
};

interface DigaParameterDefinition {
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description?: string;
  itemsType?: 'string' | 'number' | 'boolean';
}

function mapDigaTypeToPropertyType(
  dataType: 'string' | 'number' | 'boolean' | 'array',
): PropertyType {
  switch (dataType) {
    case 'number':
      return PropertyType.NUMBER;
    case 'boolean':
      return PropertyType.CHECKBOX;
    case 'array':
      return PropertyType.ARRAY;
    case 'string':
    default:
      return PropertyType.SHORT_TEXT;
  }
}

function FunctionCallTestingDialog({
  open,
  onOpenChange,
  onTestingSuccess,
}: FunctionCallTestingDialogProps) {
  const form = useFormContext<FlowTrigger>();
  const formValues = form.getValues();
  const flowName = useBuilderStateContext((state) => state.flow.version?.displayName ?? 'function');

  // Get the configured parameters from the trigger settings
  const formProps = (formValues.settings.input?.parameters ?? []) as DigaParameterDefinition[];

  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    testStepHooks.useSaveMockData({
      onSuccess: () => {
        onTestingSuccess();
        onOpenChange(false);
      },
    });

  const testingForm = useForm<Record<string, any>>({
    shouldFocusError: true,
    defaultValues: formProps
      .filter((field: DigaParameterDefinition) => field.name?.trim() !== '')
      .reduce((acc, field: DigaParameterDefinition) => {
        if (field.dataType === 'boolean') {
          acc[field.name] = false;
        } else if (field.dataType === 'array') {
          acc[field.name] = [];
        } else {
          acc[field.name] = '';
        }
        return acc;
      }, {} as Record<string, any>),
    resolver: (values) => {
      const errors = formProps.reduce((acc, field: DigaParameterDefinition) => {
        if (field.required && field.dataType !== 'boolean') {
          const value = values[field.name];
          const isEmpty =
            field.dataType === 'array'
              ? !Array.isArray(value) || value.length === 0
              : !value;

          if (isEmpty) {
            acc[field.name] = {
              type: 'required',
              message: t('{field} is required', { field: field.name }),
            };
          }
        }
        return acc;
      }, {} as Record<string, { type: string; message: string }>);

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
    mode: 'onChange',
  });

  // Convert parameters to PiecePropertyMap for rendering
  const pieceProps = formProps
    .filter((field: DigaParameterDefinition) => field.name?.trim() !== '')
    .reduce((acc, field: DigaParameterDefinition) => {
      if (field.dataType === 'array') {
        // For array types, configure with inner properties based on itemsType
        const itemType = mapDigaTypeToPropertyType(field.itemsType || 'string');
        const pieceProperty = {
          displayName: field.name,
          description: field.description || '',
          required: field.required,
          type: PropertyType.ARRAY,
          defaultValue: [],
          properties: {
            value: {
              displayName: 'Value',
              description: '',
              required: true,
              type: itemType,
            },
          },
        } as unknown as PieceProperty;
        acc[field.name] = pieceProperty;
      } else {
        const pieceProperty = {
          displayName: field.name,
          description: field.description || '',
          required: field.required,
          type: mapDigaTypeToPropertyType(field.dataType),
          defaultValue: field.dataType === 'boolean' ? false : undefined,
        } as PieceProperty;
        acc[field.name] = pieceProperty;
      }
      return acc;
    }, {} as PiecePropertyMap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="px-0.5">
            {t('Function Call Sample Data')}
          </DialogTitle>
          <DialogDescription className="px-0.5">
            {t(
              'Fill in the parameter values to generate sample data for testing the flow.',
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...testingForm}>
          <form
            className="grid space-y-4"
            onSubmit={testingForm.handleSubmit((data) => {
              // Construct the full webhook payload structure
              const functionName =
                flowName.toLowerCase().replace(/\s+/g, '_') || 'function';

              // Transform array fields: extract values from {value: x} objects
              const transformedArguments = Object.entries(data).reduce(
                (acc, [key, value]) => {
                  const fieldDef = formProps.find((f) => f.name === key);
                  if (fieldDef?.dataType === 'array' && Array.isArray(value)) {
                    // Extract 'value' from each array item object
                    acc[key] = value.map((item: { value: unknown }) => item.value);
                  } else {
                    acc[key] = value;
                  }
                  return acc;
                },
                {} as Record<string, unknown>,
              );

              const fullPayload = {
                call_id: crypto.randomUUID(),
                function_name: functionName,
                arguments: transformedArguments,
                agent_id: crypto.randomUUID(),
                agent_version_id: crypto.randomUUID(),
                contact_id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                dynamic_variables: {},
              };

              saveMockAsSampleData(fullPayload);
            })}
          >
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="py-4">
                {Object.keys(pieceProps).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(pieceProps).map(
                      ([fieldName, fieldProps]) => {
                        const fieldError =
                          testingForm.formState.errors[fieldName];

                        return (
                          <div
                            key={fieldName}
                            className="grid space-y-2 px-0.5"
                          >
                            <GenericPropertiesForm
                              props={{ [fieldName]: fieldProps }}
                              propertySettings={null}
                              dynamicPropsInfo={null}
                              prefixValue=""
                              useMentionTextInput={false}
                              disabled={false}
                            />

                            {fieldError && (
                              <p className="text-xs text-destructive font-medium">
                                {fieldError.message?.toString()}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('No parameters defined for this function call')}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSavingMockdata}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isSavingMockdata}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { FunctionCallTestingDialog };
