import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { api } from '@/lib/api';
import {
  FileType,
  Trigger,
  TriggerEventWithPayload,
  ErrorCode,
  ApErrorParams,
  isNil,
  SeekPage,
  McpPropertyType,
} from '@activepieces/shared';
import {
  PropertyType,
  PiecePropertyMap,
  PieceProperty,
} from '@activepieces/pieces-framework';

import { useBuilderStateContext } from '../../builder-hooks';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { testStepUtils } from '../test-step-utils';
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
  const formProps = formValues.settings.input.inputSchema || [];

  const { setSampleData, setSampleDataInput } =
  useBuilderStateContext((state) => {
    return {
      setSampleData: state.setSampleData,
      setSampleDataInput: state.setSampleDataInput,
    };
  });

  // Create a form instance that will be used for the testing form
  const testingForm = useForm<Record<string, any>>({
    defaultValues: {},
    mode: "onChange",
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};
      
      // Convert formProps to pieceProps once
      const pieceProps: PiecePropertyMap = {};
      
      // Helper function to map McpPropertyType to PropertyType
      const mapMcpTypeToPropertyType = (mcpType: string): PropertyType => {
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
      };
      
      // Convert input schema to piece property map
      formProps.forEach((field: any) => {
        // Create base PieceProperty
        const pieceProperty: any = {
          displayName: field.displayName || field.name,
          description: field.description || '',
          required: field.required || false,
          type: mapMcpTypeToPropertyType(field.type),
          defaultValue: field.defaultValue,
        };
        
        pieceProps[field.name] = pieceProperty;
      });
      
      Object.entries(pieceProps).forEach(([fieldName, fieldProp]) => {
        if (fieldProp.required && !values[fieldName]) {
          errors[fieldName] = {
            type: 'required',
            message: `${fieldProp.displayName} is required`
          };
        }
      });
      
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors
      };
    }
  });

  // Reset the form when the dialog opens
  useEffect(() => {
    if (open) {
      testingForm.reset();
    }
  }, [open, testingForm]);

  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
  useMutation({
    mutationFn: async (data: Record<string, any>) => {
      // Create payload with form data
      const mockData = {
        payload: {
          inputs: data
        }
      };
      
      const response = await triggerEventsApi.saveTriggerMockdata(
        flowId,
        mockData
      );
      await updateSampleData(response);
      return response;
    },
    onSuccess: async () => {
      refetch();
      
      // Show success toast
      toast({
        title: "Form submitted successfully",
        description: "The data has been saved as sample data for testing.",
      });
      
      // Close the dialog
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error submitting form:", error);
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        let message =
          'Failed to save test data, please ensure settings are correct.';
        if (apError.code === ErrorCode.TEST_TRIGGER_FAILED) {
          message = JSON.stringify(
            {
              message:
                'Failed to save test data, please ensure settings are correct.',
              error: apError.params.message,
            },
            null,
            2,
          );
        }
        setErrorMessage(message);
      } else {
        setErrorMessage(
          testStepUtils.formatErrorMessage(
            t('Internal error, please try again later.'),
          ),
        );
      }
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

  const { data: pollResults, refetch } = useQuery<
    SeekPage<TriggerEventWithPayload>
  >({
    queryKey: ['triggerEvents', flowVersionId],
    queryFn: () =>
      triggerEventsApi.list({
        flowId: flowId,
        limit: 5,
        cursor: undefined,
      }),
    staleTime: 0,
  });

  // Extract the pieceProps from the resolver for use in the JSX
  const pieceProps = React.useMemo(() => {
    const piecePropsMap: PiecePropertyMap = {};
    
    const mapMcpTypeToPropertyType = (mcpType: string): PropertyType => {
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
    };
    
    formProps.forEach((field: any) => {
      const pieceProperty: any = {
        displayName: field.displayName || field.name,
        description: field.description || '',
        required: field.required || false,
        type: mapMcpTypeToPropertyType(field.type),
        defaultValue: field.defaultValue,
      };
      
      piecePropsMap[field.name] = pieceProperty;
    });
    
    return piecePropsMap;
  }, [formProps]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-medium">Test Tool Input</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="py-4">
            <FormProvider {...testingForm}>
              <form 
                className="space-y-5" 
                onSubmit={testingForm.handleSubmit((data) => saveMockAsSampleData(data))}
              >
                {Object.keys(pieceProps).length > 0 ? (
                  <div className="space-y-5">
                    {Object.entries(pieceProps).map(([fieldName, fieldProps]) => {
                      const fieldError = testingForm.formState.errors[fieldName];
                      
                      return (
                        <div 
                          key={fieldName}
                          className="border rounded-md border-border hover:border-muted-foreground transition-colors p-4"
                        >
                          <div className="mb-2">
                            {fieldProps.description && (
                              <p className="text-xs text-muted-foreground mb-2">{fieldProps.description}</p>
                            )}
                          </div>
                          
                          <div>
                            <AutoPropertiesFormComponent
                              props={{ [fieldName]: fieldProps }}
                              allowDynamicValues={false}
                              prefixValue=""
                              useMentionTextInput={false}
                              disabled={false}
                            />
                            
                            {fieldError && (
                              <p className="text-xs text-destructive mt-1.5 font-medium">
                                {fieldError.message?.toString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">No input fields defined in the schema</p>
                  </div>
                )}
              </form>
            </FormProvider>
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-end items-center gap-2 w-full">
            <DialogClose asChild>
              <Button variant="outline">{t('Cancel')}</Button>
            </DialogClose>
            
            {Object.keys(pieceProps).length > 0 && (
              <Button
                onClick={() => testingForm.handleSubmit(
                  (data) => saveMockAsSampleData(data),
                  (errors) => {
                    console.error('Validation errors:', errors);
                    toast({
                      title: "Validation Error",
                      description: "Please fill in all required fields.",
                      variant: "destructive"
                    });
                  }
                )()}
                disabled={isSavingMockdata}
                type="button"
              >
                {isSavingMockdata ? t('Submitting...') : t('Submit')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { McpToolTestingDialog }; 