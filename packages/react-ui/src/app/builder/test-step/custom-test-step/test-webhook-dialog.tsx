import { DialogClose } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

import { JsonEditor } from '@/components/custom/json-editor';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { HttpMethod } from '@activepieces/pieces-common';
import { Action, ApFlagId, apId, Trigger } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { DictionaryProperty } from '../../piece-properties/dictionary-property';
import testStepHooks from '../test-step-hooks';

enum BodyType {
  JSON = 'json',
  TEXT = 'text',
  FORM_DATA = 'form-data',
}

const BodyFormInput = ({
  bodyType,
  field,
}: {
  bodyType: BodyType;
  field: ControllerRenderProps<any>;
}) => {
  switch (bodyType) {
    case BodyType.JSON:
      return <JsonEditor field={field} readonly={false}></JsonEditor>;
    case BodyType.TEXT:
      return <Input {...field} />;
    case BodyType.FORM_DATA:
      return (
        <DictionaryProperty
          values={field.value}
          onChange={field.onChange}
          disabled={false}
          useMentionTextInput={false}
        ></DictionaryProperty>
      );
  }
};
const WebhookRequest = z.object({
  bodyType: z.nativeEnum(BodyType),
  body: z.union([z.object({}), z.string()]),
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  method: z.nativeEnum(HttpMethod),
});

type TestWaitForNextWebhookDialogProps = {
  currentStep: Action;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'returnResponseAndWaitForNextWebhook';
};

type TestTriggerWebhookDialogProps = {
  currentStep: Trigger;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'trigger';
  onTestFinished: () => void;
};
type TestWebhookDialogProps =
  | TestWaitForNextWebhookDialogProps
  | TestTriggerWebhookDialogProps;

const TestTriggerWebhookDialog = ({
  open,
  onOpenChange,
  testingMode,
  onTestFinished,
}: TestTriggerWebhookDialogProps) => {
  const { mutate: simulateTrigger, isPending: isSimulating } =
    testStepHooks.useSimulateTrigger({
      setErrorMessage: undefined,
      onSuccess: () => {
        onTestFinished();
        onOpenChange(false);
      },
    });

  const { mutate: onSubmit, isPending } = useMutation<
    unknown,
    Error,
    z.infer<typeof WebhookRequest>
  >({
    mutationFn: async (data: z.infer<typeof WebhookRequest>) => {
      await triggerEventsApi.startWebhookSimulation(flowId);
      simulateTrigger();
      await api.any(url, {
        method: data.method,
        data: data.body,
        headers: data.headers,
        params: data.queryParams,
      });
    },
  });
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const url = `${webhookPrefixUrl}/${flowId}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        <TestWebhookFunctionalityForm
          testingMode={testingMode}
          onSubmit={onSubmit}
          isLoading={isPending || isSimulating}
        />
      </DialogContent>
    </Dialog>
  );
};

const TestWaitForNextWebhookDialog = ({
  currentStep,
  onOpenChange,
  testingMode,
  open,
}: TestWaitForNextWebhookDialogProps) => {
  const { mutate: onSubmit, isPending: isLoading } =
    testStepHooks.useTestAction({
      currentStep,
      setErrorMessage: undefined,
      setConsoleLogs: undefined,
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        <TestWebhookFunctionalityForm
          testingMode={testingMode}
          onSubmit={(data) => {
            onSubmit({
              id: apId(),
              success: true,
              output: {
                body: data.body,
                headers: data.headers,
                queryParams: data.queryParams,
              },
              standardError: '',
              standardOutput: '',
              input: {},
            });
          }}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

type TestingWebhookFunctionalityFormProps = {
  onSubmit: (data: z.infer<typeof WebhookRequest>) => void;
  isLoading: boolean;
  testingMode: 'returnResponseAndWaitForNextWebhook' | 'trigger';
};

const TestWebhookFunctionalityForm = (
  req: TestingWebhookFunctionalityFormProps,
) => {
  const { testingMode, onSubmit, isLoading } = req;
  const form = useForm<z.infer<typeof WebhookRequest>>({
    defaultValues: {
      bodyType: BodyType.JSON,
      body: {},
      headers: {},
      queryParams: {},
      method: HttpMethod.GET,
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {testingMode === 'trigger' && (
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t('Method')}</FormLabel>
                  <SearchableSelect
                    options={Object.values(HttpMethod).map((method) => ({
                      value: method,
                      label: method,
                    }))}
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    value={field.value}
                    disabled={false}
                    placeholder={t('Select an option')}
                  />
                </FormItem>
              );
            }}
          />
        )}
        <Tabs defaultValue="queryParams">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queryParams">{t('Query Params')}</TabsTrigger>

            <TabsTrigger value="headers">{t('Headers')}</TabsTrigger>

            <TabsTrigger value="body">{t('Body')}</TabsTrigger>
          </TabsList>
          <TabsContent value="queryParams">
            <FormField
              control={form.control}
              name="queryParams"
              render={({ field }) => {
                return (
                  <FormItem>
                    <DictionaryProperty
                      values={field.value}
                      onChange={field.onChange}
                      disabled={false}
                      useMentionTextInput={false}
                    ></DictionaryProperty>
                  </FormItem>
                );
              }}
            ></FormField>
          </TabsContent>

          <TabsContent value="headers">
            <FormField
              control={form.control}
              name="headers"
              render={({ field }) => {
                return (
                  <FormItem>
                    <DictionaryProperty
                      values={field.value}
                      onChange={field.onChange}
                      disabled={false}
                      useMentionTextInput={false}
                    ></DictionaryProperty>
                  </FormItem>
                );
              }}
            ></FormField>
          </TabsContent>
          <TabsContent value="body">
            <>
              <FormField
                name="bodyType"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>{t('Type')}</FormLabel>
                      <SearchableSelect
                        options={[
                          {
                            value: BodyType.JSON,
                            label: t('JSON'),
                          },
                          {
                            value: BodyType.TEXT,
                            label: t('Text'),
                          },
                          {
                            value: BodyType.FORM_DATA,
                            label: t('Form Data'),
                          },
                        ]}
                        onChange={(val) => {
                          field.onChange(val);
                          switch (val) {
                            case BodyType.JSON:
                            case BodyType.FORM_DATA:
                              form.setValue('body', {});
                              break;
                            case BodyType.TEXT:
                              form.setValue('body', '');
                              break;
                          }
                        }}
                        value={field.value}
                        disabled={false}
                        placeholder={t('Select an option')}
                        showDeselect={true}
                      ></SearchableSelect>
                    </FormItem>
                  );
                }}
              ></FormField>
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => {
                  return (
                    <FormItem className="mt-4">
                      <FormLabel>{t('Body')}</FormLabel>
                      <BodyFormInput
                        bodyType={form.getValues('bodyType')}
                        field={field}
                      ></BodyFormInput>
                    </FormItem>
                  );
                }}
              ></FormField>
            </>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isLoading}>
            {t('Send')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

TestWebhookFunctionalityForm.displayName = 'TestWebhookFunctionalityDialog';

const TestWebhookDialog = (props: TestWebhookDialogProps) => {
  const { testingMode, currentStep, open, onOpenChange } = props;

  if (testingMode === 'returnResponseAndWaitForNextWebhook') {
    return (
      <TestWaitForNextWebhookDialog
        currentStep={currentStep}
        open={open}
        onOpenChange={onOpenChange}
        testingMode={testingMode}
      />
    );
  }
  if (testingMode === 'trigger') {
    return (
      <TestTriggerWebhookDialog
        currentStep={currentStep}
        open={open}
        onOpenChange={onOpenChange}
        testingMode={testingMode}
        onTestFinished={props.onTestFinished}
      />
    );
  }
};

TestWebhookDialog.displayName = 'TestWebhookDialog';
export default TestWebhookDialog;
