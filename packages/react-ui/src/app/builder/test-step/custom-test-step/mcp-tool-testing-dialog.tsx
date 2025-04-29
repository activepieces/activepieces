import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useEffect } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import {
  PropertyType,
  PiecePropertyMap,
  PieceProperty,
} from '@activepieces/pieces-framework';
import {
  FileType,
  Trigger,
  TriggerEventWithPayload,
  isNil,
  SeekPage,
  McpPropertyType,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';

type McpToolTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowVersionId: string;
  projectId: string;
  setErrorMessage: (errorMessage: string | undefined) => void;
  setLastTestDate: (lastTestDate: string) => void;
};

interface McpFormField {
  name: string;
  description?: string;
  required: boolean;
  type: McpPropertyType;
  defaultValue?: any;
}

function McpToolTestingDialog({
  open,
  onOpenChange,
  flowId,
  flowVersionId,
  projectId,
  setErrorMessage,
  setLastTestDate,
}: McpToolTestingDialogProps) {
  const form = useFormContext<Trigger>();
  const formValues = form.getValues();
  const formProps = React.useMemo(
    () => formValues.settings.input.inputSchema || [],
    [formValues.settings.input.inputSchema],
  );

  const { setSampleData, setSampleDataInput } = useBuilderStateContext(
    (state) => ({
      setSampleData: state.setSampleData,
      setSampleDataInput: state.setSampleDataInput,
    }),
  );

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

  const testingForm = useForm<Record<string, any>>({
    defaultValues: {},
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};

      formProps.forEach((field: McpFormField) => {
        if (
          field.required &&
          field.type !== McpPropertyType.BOOLEAN &&
          !values[field.name]
        ) {
          errors[field.name] = {
            type: 'required',
            message: t('{field} is required', { field: field.name }),
          };
        }
      });

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  useEffect(() => {
    if (open) {
      testingForm.reset();
    }
  }, [open, testingForm]);

  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    useMutation({
      mutationFn: async (data: Record<string, any>) => {
        const mockData = {
          parameters: data,
        };

        const response = await triggerEventsApi.saveTriggerMockdata(
          flowId,
          mockData,
        );
        await updateSampleData(response);
        return response;
      },
      onSuccess: async () => {
        refetch();
        onOpenChange(false);
      },
    });

  async function updateSampleData(data: TriggerEventWithPayload) {
    let sampleDataFileId: string | undefined = undefined;
    const sampleDataInputFile = await sampleDataApi.save({
      flowVersionId,
      stepName: formValues.name,
      payload: formValues.settings?.input ?? {},
      projectId: projectId,
      fileType: FileType.SAMPLE_DATA_INPUT,
    });

    if (!isNil(data.payload)) {
      const sampleFile = await sampleDataApi.save({
        flowVersionId,
        stepName: formValues.name,
        payload: data.payload,
        projectId: projectId,
        fileType: FileType.SAMPLE_DATA,
      });
      sampleDataFileId = sampleFile.id;
    }

    form.setValue(
      'settings.inputUiInfo',
      {
        ...formValues.settings.inputUiInfo,
        sampleDataFileId,
        sampleDataInputFileId: sampleDataInputFile.id,
        currentSelectedData: undefined,
        lastTestDate: dayjs().toISOString(),
      },
      { shouldValidate: true },
    );
    setLastTestDate(dayjs().toISOString());
    setSampleData(formValues.name, data.payload);
    setSampleDataInput(formValues.name, formValues.settings?.input ?? {});
  }

  const { refetch } = useQuery<SeekPage<TriggerEventWithPayload>>({
    queryKey: ['triggerEvents', flowVersionId],
    queryFn: () =>
      triggerEventsApi.list({
        flowId: flowId,
        limit: 5,
        cursor: undefined,
      }),
    staleTime: 0,
  });

  const pieceProps = React.useMemo(() => {
    const piecePropsMap: PiecePropertyMap = {};

    formProps.forEach((field: McpFormField) => {
      const pieceProperty = {
        displayName: field.name,
        description: field.description || '',
        required: field.required,
        type: mapMcpTypeToPropertyType(field.type),
        defaultValue: field.defaultValue,
      } as PieceProperty;

      piecePropsMap[field.name] = pieceProperty;
    });

    return piecePropsMap;
  }, [formProps]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('Test Tool')}</DialogTitle>
          <DialogDescription>
            {t('Enter sample values to test your tool.')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="py-4">
            <FormProvider {...testingForm}>
              <form
                className="grid space-y-4"
                onSubmit={testingForm.handleSubmit((data) =>
                  saveMockAsSampleData(data),
                )}
              >
                {Object.keys(pieceProps).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(pieceProps).map(
                      ([fieldName, fieldProps]) => {
                        const fieldError =
                          testingForm.formState.errors[fieldName];

                        return (
                          <div key={fieldName} className="grid space-y-2">
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
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('No input fields defined in the schema')}
                    </p>
                  </div>
                )}
              </form>
            </FormProvider>
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
          <Button
            type="submit"
            loading={isSavingMockdata}
            onClick={testingForm.handleSubmit(
              (data) => saveMockAsSampleData(data),
              (errors) => {
                console.error('Validation errors:', errors);
                toast({
                  title: t('Validation Error'),
                  description: t('Please fill in all required fields.'),
                  variant: 'destructive',
                  duration: 5000,
                });
              },
            )}
          >
            {isSavingMockdata ? t('Testing...') : t('Test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { McpToolTestingDialog };
