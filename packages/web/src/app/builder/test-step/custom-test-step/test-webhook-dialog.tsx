import { isNil } from '@activepieces/core-utils';
import { FlowAction, ApFlagId, FlowTrigger } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { t } from 'i18next';
import { AlertTriangle, Info } from 'lucide-react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DictionaryInput } from '@/components/custom/dictionary-input';
import { JsonEditor } from '@/components/custom/json-editor';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { wait } from '@/lib/dom-utils';

import { useBuilderStateContext } from '../../builder-hooks';

enum BodyType {
  JSON = 'json',
  TEXT = 'text',
  FORM_DATA = 'form-data',
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
}

const SAMPLE_DATA_WAIT_SECONDS = 30;

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
        <DictionaryInput
          values={field.value}
          onChange={field.onChange}
          disabled={false}
        />
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

const CatchWebhookAuthSettings = z.object({
  settings: z.object({
    input: z.object({
      authType: z.enum(['none', 'basic', 'header', 'hmac']),
      authFields: z
        .object({
          headerName: z.string().optional(),
          hmacHeaderName: z.string().optional(),
        })
        .optional(),
    }),
  }),
});

type TestWaitForNextWebhookDialogProps = {
  currentStep: FlowAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'returnResponseAndWaitForNextWebhook';
};

type TestTriggerWebhookDialogProps = {
  currentStep: FlowTrigger;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testingMode: 'trigger';
};
type TestWebhookDialogProps =
  | TestWaitForNextWebhookDialogProps
  | TestTriggerWebhookDialogProps;

const TestTriggerWebhookDialog = ({
  currentStep,
  open,
  onOpenChange,
}: TestTriggerWebhookDialogProps) => {
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const authRequirement = describeAuthRequirement(currentStep);
  const {
    mutate: sendRequest,
    isPending,
    isSuccess: waitExpired,
  } = useMutation<unknown, Error, z.infer<typeof WebhookRequest>>({
    mutationFn: async (data: z.infer<typeof WebhookRequest>) => {
      await axios({
        url: `${webhookPrefixUrl}/${flowId}/test`,
        method: data.method,
        data: data.body,
        headers: data.headers,
        params: data.queryParams,
      });
      await wait(SAMPLE_DATA_WAIT_SECONDS * 1000);
    },
    onError: (error) =>
      toast.error(
        api.extractServerErrorMessage(
          error,
          t('Internal error, please try again later.'),
        ),
      ),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        {authRequirement && (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>{authRequirement}</AlertDescription>
          </Alert>
        )}
        {waitExpired && (
          <Alert variant="warning">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {t(
                'No sample data arrived after {seconds} seconds. It can still arrive while this dialog stays open. If it does not, check the request and the trigger settings, then send again.',
                { seconds: SAMPLE_DATA_WAIT_SECONDS },
              )}
            </AlertDescription>
          </Alert>
        )}
        <TestWebhookFunctionalityForm
          showMethodDropdown={true}
          onSubmit={sendRequest}
          isLoading={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

const TestWaitForNextWebhookDialog = ({
  currentStep,
  onOpenChange,
  open,
}: TestWaitForNextWebhookDialogProps) => {
  const [updateSampleData] = useBuilderStateContext((state) => [
    state.updateSampleData,
  ]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Send Sample Data to Webhook')}</DialogTitle>
        </DialogHeader>
        <TestWebhookFunctionalityForm
          showMethodDropdown={false}
          isLoading={false}
          onSubmit={(data) => {
            updateSampleData({
              stepName: currentStep.name,
              output: {
                body: data.body,
                headers: data.headers,
                queryParams: data.queryParams,
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

type TestingWebhookFunctionalityFormProps = {
  onSubmit: (data: z.infer<typeof WebhookRequest>) => void;
  isLoading: boolean;
  showMethodDropdown: boolean;
};

const TestWebhookFunctionalityForm = (
  req: TestingWebhookFunctionalityFormProps,
) => {
  const { showMethodDropdown, onSubmit, isLoading } = req;
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
        {showMethodDropdown && (
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
                    <DictionaryInput
                      values={field.value}
                      onChange={field.onChange}
                      disabled={false}
                    />
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
                    <DictionaryInput
                      values={field.value}
                      onChange={field.onChange}
                      disabled={false}
                    />
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
      />
    );
  }
};

function describeAuthRequirement(trigger: FlowTrigger): string | null {
  const parsed = CatchWebhookAuthSettings.safeParse(trigger);
  if (!parsed.success) {
    return null;
  }
  const { authType, authFields } = parsed.data.settings.input;
  switch (authType) {
    case 'none':
      return null;
    case 'header': {
      const headerName = toLiteralHeaderName(authFields?.headerName);
      if (isNil(headerName)) {
        return t(
          'This trigger only accepts requests that include its authentication header. Add the header in the Headers tab before you send.',
        );
      }
      return t(
        'This trigger only accepts requests that include the {headerName} header. Add the header in the Headers tab before you send.',
        { headerName },
      );
    }
    case 'basic':
      return t(
        'This trigger uses Basic Auth. Add an Authorization header with the username and password from the trigger settings before you send.',
      );
    case 'hmac': {
      const headerName = toLiteralHeaderName(authFields?.hmacHeaderName);
      if (isNil(headerName)) {
        return t(
          'This trigger checks an HMAC signature. Add the signature header with the signature of the exact request body before you send. You can also send the sample to the Test URL from the service that signs the request.',
        );
      }
      return t(
        'This trigger checks an HMAC signature. Add the {headerName} header with the signature of the exact request body before you send. You can also send the sample to the Test URL from the service that signs the request.',
        { headerName },
      );
    }
  }
}

function toLiteralHeaderName(headerName: string | undefined): string | null {
  const trimmed = headerName?.trim();
  if (isNil(trimmed) || trimmed === '' || trimmed.includes('{{')) {
    return null;
  }
  return trimmed;
}

TestWebhookDialog.displayName = 'TestWebhookDialog';
export default TestWebhookDialog;
