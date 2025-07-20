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
import {
  Trigger,
  McpPropertyType,
  fixSchemaNaming,
} from '@activepieces/shared';

import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';
import testStepHooks from '../test-step-hooks';

type McpToolTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestingSuccess: () => void;
};

interface McpFormField {
  name: string;
  description?: string;
  required: boolean;
  type: McpPropertyType;
  defaultValue?: any;
}
function mapMcpTypeToPropertyType(mcpType: McpPropertyType): PropertyType {
  switch (mcpType) {
    case McpPropertyType.NUMBER:
      return PropertyType.NUMBER;
    case McpPropertyType.BOOLEAN:
      return PropertyType.CHECKBOX;
    case McpPropertyType.OBJECT:
      return PropertyType.OBJECT;
    case McpPropertyType.DATE:
      return PropertyType.DATE_TIME;
    case McpPropertyType.ARRAY:
      return PropertyType.ARRAY;
    case McpPropertyType.TEXT:
    default:
      return PropertyType.SHORT_TEXT;
  }
}

function McpToolTestingDialog({
  open,
  onOpenChange,
  onTestingSuccess,
}: McpToolTestingDialogProps) {
  const form = useFormContext<Trigger>();
  const formValues = form.getValues();
  const formProps = formValues.settings.input.inputSchema as McpFormField[];
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
      .filter((field: McpFormField) => field.name.trim() !== '')
      .reduce((acc, field: McpFormField) => {
        acc[field.name] = field.type === McpPropertyType.BOOLEAN ? false : '';
        return acc;
      }, {} as Record<string, any>),
    resolver: (values) => {
      const errors = formProps.reduce((acc, field: McpFormField) => {
        if (
          field.required &&
          field.type !== McpPropertyType.BOOLEAN &&
          !values[field.name]
        ) {
          acc[field.name] = {
            type: 'required',
            message: t('{field} is required', { field: field.name }),
          };
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

  const pieceProps = formProps.reduce((acc, field: McpFormField) => {
    const pieceProperty = {
      displayName: field.name,
      description: field.description || '',
      required: field.required,
      type: mapMcpTypeToPropertyType(field.type),
      defaultValue: field.defaultValue,
    } as PieceProperty;

    acc[field.name] = pieceProperty;
    return acc;
  }, {} as PiecePropertyMap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="px-0.5">{t('Tool Sample Data')}</DialogTitle>
          <DialogDescription className="px-0.5">
            {t(
              'Fill in the following fields to use them as sample data for the trigger.',
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...testingForm}>
          <form
            className="grid space-y-4"
            onSubmit={testingForm.handleSubmit((data) => {
              const cleanedData = Object.fromEntries(
                Object.entries(data)
                  .filter(([key, _]) => key.trim() !== '')
                  .map(([key, value]) => [fixSchemaNaming(key), value]),
              );
              saveMockAsSampleData(cleanedData);
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
                            <AutoPropertiesFormComponent
                              props={{ [fieldName]: fieldProps }}
                              allowDynamicValues={false}
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
                      {t('No input fields defined in the schema')}
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

export { McpToolTestingDialog };
