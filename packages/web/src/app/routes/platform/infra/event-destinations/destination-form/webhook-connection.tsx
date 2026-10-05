import { isNil } from '@activepieces/core-utils';
import { ApFlagId, ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Info, Plus, Workflow } from 'lucide-react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HorizontalSeparatorWithText } from '@/components/ui/separator';
import { flowHooks } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

import { destinationErrors } from '../lib/destination-errors';
import {
  destinationFormUtils,
  DestinationFormValues,
} from '../lib/destination-form-utils';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { buildEventLabels } from '../lib/event-labels';
import { handlerFlowBuilder } from '../lib/handler-flow-builder';

import { EncryptedHeadersNotice, HeadersField } from './connection-fields';
import { TestEventCard } from './test-event-card';

export const WebhookConnection = ({
  form,
  isEdit,
  storedHeaderNames,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
  storedHeaderNames: string[];
}) => {
  const url = useWatch({ control: form.control, name: 'url' });
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const handlerFlowId = destinationFormUtils.toHandlerFlowId({
    url,
    webhookPrefixUrl: webhookPrefixUrl ?? null,
  });
  const isHandlerFlow = !isNil(handlerFlowId);

  return (
    <div className="flex flex-col gap-6">
      {!isEdit && !isHandlerFlow && (
        <>
          <GenerateHandlerFlowCard
            form={form}
            webhookPrefixUrl={webhookPrefixUrl ?? null}
          />
          <HorizontalSeparatorWithText className="text-gray-11">
            {t('or')}
          </HorizontalSeparatorWithText>
        </>
      )}

      <FormField
        control={form.control}
        name="url"
        rules={{ deps: ['headers'] }}
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequiredIndicator>
              {isEdit || isHandlerFlow
                ? t('Endpoint URL')
                : t('Use your own webhook URL')}
            </FormLabel>
            <FormControl>
              <Input placeholder="https://" {...field} />
            </FormControl>
            {url === '' && (
              <FormDescription>
                {t(
                  'Any endpoint that accepts a JSON POST. Headers and a test send appear after you paste a URL.',
                )}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {isHandlerFlow && (
        <>
          <HandlerFlowCard flowId={handlerFlowId} />
          <Alert>
            <Info className="size-4" />
            <AlertTitle>
              {isEdit
                ? t('Keep this flow published so it receives events')
                : t('Publish the flow before you create the destination')}
            </AlertTitle>
            <AlertDescription>
              {t(
                'The flow receives each selected event as a plain JSON object.',
              )}
            </AlertDescription>
          </Alert>
        </>
      )}

      {url !== '' && (
        <>
          <HeadersField
            form={form}
            storedHeaderNames={storedHeaderNames}
            keyPlaceholder="Authorization"
          />
          <EncryptedHeadersNotice />
          <TestEventCard
            form={form}
            description={
              isHandlerFlow
                ? t(
                    'Sends a sample to the handler flow, which runs it like any other event. Publish the flow first, or the test answers 404.',
                  )
                : t('Sends one of your selected events to the endpoint above.')
            }
            storedHeaderNames={storedHeaderNames}
          />
        </>
      )}
    </div>
  );
};

const GenerateHandlerFlowCard = ({
  form,
  webhookPrefixUrl,
}: {
  form: UseFormReturn<DestinationFormValues>;
  webhookPrefixUrl: string | null;
}) => {
  const eventLabels = buildEventLabels();
  const selectedEvents = useWatch({ control: form.control, name: 'events' });

  const { mutate: importHandlerFlow, isPending: isImporting } =
    eventDestinationsCollectionUtils.useImportHandlerFlow({
      onSuccess: (createdFlow) => {
        form.setValue('url', `${webhookPrefixUrl}/${createdFlow.id}`, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
      onError: (error) => {
        toast.error(t('Error'), {
          description: api.isError(error)
            ? destinationErrors.describe(error)
            : error.message,
        });
      },
    });

  const handleGenerate = () => {
    if (isNil(webhookPrefixUrl) || webhookPrefixUrl === '') {
      toast.error(t('Webhook URL prefix is not configured.'));
      return;
    }
    importHandlerFlow({
      template: handlerFlowBuilder.buildHandlerFlowTemplate({
        events: selectedEvents.map((name) => ({
          name,
          label: eventLabels[name],
        })),
        labels: handlerFlowLabels({ selectedEvents, eventLabels }),
      }),
      selectedEvents,
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-accent-3 text-accent-11">
        <Workflow className="size-[18px]" />
      </span>
      <div className="flex max-w-[460px] flex-col gap-1">
        <span className="text-sm font-medium">
          {t('Create a handler flow')}
        </span>
        <span className="text-sm leading-normal text-gray-11">
          {t(
            "We'll create a flow with a webhook trigger, loaded with sample data for {count, plural, =1 {the event} other {the # events}} you picked. Add steps for Slack, Gmail, or any app.",
            { count: selectedEvents.length },
          )}
        </span>
      </div>
      <Button
        {...adminControl(AdminControl.EVENT_DESTINATIONS_HANDLER_FLOW_RUN)}
        type="button"
        onClick={handleGenerate}
        disabled={isImporting || selectedEvents.length === 0}
        loading={isImporting}
      >
        <Plus className="size-4" />
        {t('Generate handler flow')}
      </Button>
    </div>
  );
};

const HandlerFlowCard = ({ flowId }: { flowId: string }) => {
  const { data: flow } = flowHooks.useGetFlow({ flowId });

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-3 text-accent-11">
        <Workflow className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">
          {flow?.version.displayName ?? t('Handler flow')}
        </span>
      </div>
      {!isNil(flow) && (
        <Badge
          className="rounded-md"
          variant={isNil(flow.publishedVersionId) ? 'warning' : 'success'}
        >
          {isNil(flow.publishedVersionId) ? t('Draft') : t('Published')}
        </Badge>
      )}
      <Button
        {...adminControl(AdminControl.EVENT_DESTINATIONS_HANDLER_FLOW_LINK)}
        type="button"
        variant="outline"
        size="sm"
        asChild
      >
        <a href={`/flows/${flowId}`} target="_blank" rel="noopener noreferrer">
          {t('Open flow')}
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
    </div>
  );
};

function handlerFlowLabels({
  selectedEvents,
  eventLabels,
}: {
  selectedEvents: ApplicationEventName[];
  eventLabels: ReturnType<typeof buildEventLabels>;
}) {
  return {
    flowDisplayName: t('Event handler starter'),
    flowDescription: t(
      'Routes audit events into branches you can wire to Slack, Gmail, Teams, or any HTTP endpoint.',
    ),
    webhookTriggerDisplayName: t('Catch Webhook'),
    eventTypeRouterDisplayName: t('Event type checker'),
    runStatusRouterDisplayName: t('Run status check'),
    failedRunBranchName: t('Failed run'),
    otherwiseBranchName: t('Otherwise'),
    noteContent: t(
      '**Audit event handler**\n\nThis flow runs whenever any of these events fire:\n\n{events}\n\n**Add your channel** (Slack, Gmail, Teams, HTTP…) inside each branch below.\n\nOnce you are done:\n\n1. **Publish this flow** so it can receive events.\n2. Head back to the **Event Streaming** tab and create the destination to start sending events here.',
      {
        events: selectedEvents
          .map((name) => `- ${eventLabels[name]}`)
          .join('\n'),
      },
    ),
    sampleDataNoteContent: t(
      '**Test different scenarios**\n\nOpen the trigger and edit its **Sample Data** to swap in a different event payload and test each branch without firing real audit events.',
    ),
  };
}
