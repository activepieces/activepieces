import { isNil } from '@activepieces/core-utils';
import { ApFlagId, EventDestination } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Fragment, useRef, useState } from 'react';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { UnsavedChangesGuard } from '@/components/custom/leave-without-saving';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { DangerZone, SaveBar } from '@/components/custom/settings-parts';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { flowHooks } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

import { DeleteDestinationDialog } from '../components/delete-destination-dialog';
import { destinationErrors } from '../lib/destination-errors';
import {
  destinationFormUtils,
  DestinationFormValues,
} from '../lib/destination-form-utils';
import {
  DESTINATION_KIND_SEARCH_PARAM,
  destinationKinds,
} from '../lib/destination-kinds';
import { destinationSummary } from '../lib/destination-summary';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { eventGroupUtils } from '../lib/event-groups';
import { EVENT_STREAMING_PATH } from '../lib/event-streaming-path';
import { parseFlowIdFromUrl } from '../lib/parse-flow-id-from-url';

import { ConnectionStep } from './connection-step';
import { DestinationStep } from './destination-step';
import { EventsStep } from './events-step';

const EventDestinationFormPage = () => {
  const { id } = useParams<{ id: string }>();
  return isNil(id) ? (
    <NewDestinationForm />
  ) : (
    <EditDestination key={id} destinationId={id} />
  );
};

const EditDestination = ({ destinationId }: { destinationId: string }) => {
  const { platform } = platformHooks.useCurrentPlatform();
  if (!platform.plan.eventStreamingEnabled) {
    return <Navigate to={EVENT_STREAMING_PATH} replace />;
  }
  return <FreshDestination destinationId={destinationId} />;
};

const FreshDestination = ({ destinationId }: { destinationId: string }) => {
  const opened =
    eventDestinationsCollectionUtils.useFreshDestination(destinationId);

  switch (opened.status) {
    case 'loading':
      return (
        <Page width="narrow">
          <PageHeader back={BACK_LINK()} title={t('Edit destination')} />
          <SkeletonList numberOfItems={4} className="h-16 w-full" />
        </Page>
      );
    case 'error':
      return (
        <Page width="narrow">
          <PageHeader back={BACK_LINK()} title={t('Edit destination')} />
          <DataFetchErrorState
            entity={t('destination')}
            onRetry={eventDestinationsCollectionUtils.refetch}
          />
        </Page>
      );
    case 'missing':
      return <Navigate to={EVENT_STREAMING_PATH} replace />;
    case 'ready':
      return <EditDestinationForm destination={opened.destination} />;
  }
};

const NewDestinationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetKind = destinationKinds.parse(
    searchParams.get(DESTINATION_KIND_SEARCH_PARAM),
  );
  const [stepIndex, setStepIndex] = useState(
    isNil(presetKind) ? DESTINATION_STEP : EVENTS_STEP,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const { form, isFormatAutoSwitched, leaving } = useDestinationForm({
    destination: null,
    presetKind,
  });

  const { mutate: saveDestination, isPending: isSaving } =
    eventDestinationsCollectionUtils.useSaveEventDestination({
      onSuccess: () => {
        toast.success(t('Destination created'));
        leaving.current = true;
        navigate(EVENT_STREAMING_PATH);
      },
      onError: (error) => {
        mutationFeedback.markShown(error);
        setSaveError(destinationErrors.describe(error));
      },
    });

  const handleSubmit = (values: DestinationFormValues) => {
    setSaveError(null);
    saveDestination({
      destinationId: null,
      request: destinationFormUtils.toRequest(values),
    });
  };

  const handleInvalidSubmit = (errors: FieldErrors<DestinationFormValues>) => {
    setStepIndex(isNil(errors.events) ? CONNECTION_STEP : EVENTS_STEP);
    setSaveError(t('Please fix the highlighted fields before saving'));
  };

  const goToNextStep = async () => {
    if (stepIndex === EVENTS_STEP && !(await form.trigger('events'))) {
      return;
    }
    setStepIndex(Math.min(stepIndex + 1, CONNECTION_STEP));
  };

  const watchedEvents = useWatch({ control: form.control, name: 'events' });
  const watchedFormat = useWatch({ control: form.control, name: 'format' });
  const selectedKind = destinationKinds.kindOf(watchedFormat);
  const selectedKindTitle =
    destinationKinds
      .buildOptions()
      .find((option) => option.kind === selectedKind)?.shortTitle ?? '';
  const isLastStep = stepIndex === CONNECTION_STEP;
  const step = STEP_COPY()[stepIndex];

  return (
    <>
      <Form {...form}>
        <form className="contents" onSubmit={(event) => event.preventDefault()}>
          <Page
            width="narrow"
            footer={
              <>
                {saveError ? (
                  <span role="alert" className="flex-1 text-sm text-danger-11">
                    {saveError}
                  </span>
                ) : (
                  <span className="flex-1 text-sm text-gray-11">
                    {stepIndex === EVENTS_STEP
                      ? t('{selected} of {total} events selected', {
                          selected: watchedEvents.length,
                          total: eventGroupUtils.countEvents(),
                        })
                      : t('Step {current} of {total}', {
                          current: stepIndex + 1,
                          total: STEP_COUNT,
                        })}
                  </span>
                )}
                {stepIndex > DESTINATION_STEP ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setStepIndex(stepIndex - 1)}
                  >
                    {t('Back')}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" asChild>
                    <Link to={EVENT_STREAMING_PATH}>{t('Cancel')}</Link>
                  </Button>
                )}
                {isLastStep ? (
                  <Button
                    {...adminControl(
                      AdminControl.EVENT_DESTINATIONS_DESTINATION_CREATE_SUBMIT,
                    )}
                    type="button"
                    loading={isSaving}
                    disabled={isSaving}
                    onClick={form.handleSubmit(
                      handleSubmit,
                      handleInvalidSubmit,
                    )}
                  >
                    {t('Create destination')}
                  </Button>
                ) : (
                  <Button type="button" onClick={goToNextStep}>
                    {t('Continue')}
                  </Button>
                )}
              </>
            }
          >
            <PageHeader
              back={BACK_LINK()}
              title={t('New destination')}
              description={t(
                'Choose where events go, which events to send, then connect it.',
              )}
            />
            <StepHeader
              steps={[
                { title: t('Destination'), doneTitle: selectedKindTitle },
                { title: t('Events'), doneTitle: t('Events') },
                { title: t('Connection'), doneTitle: t('Connection') },
              ]}
              activeIndex={stepIndex}
              onSelect={setStepIndex}
            />
            <Panel title={step.title} description={step.description}>
              {stepIndex === DESTINATION_STEP && (
                <DestinationStep form={form} isEdit={false} />
              )}
              {stepIndex === EVENTS_STEP && <EventsStep form={form} />}
              {stepIndex === CONNECTION_STEP && (
                <ConnectionStep
                  form={form}
                  isEdit={false}
                  storedHeaderNames={[]}
                  isFormatAutoSwitched={isFormatAutoSwitched}
                />
              )}
            </Panel>
          </Page>
        </form>
      </Form>
      <UnsavedChangesGuard dirty={form.formState.isDirty} standDown={leaving} />
    </>
  );
};

const EditDestinationForm = ({
  destination,
}: {
  destination: EventDestination;
}) => {
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const storedHeaderNames = Object.keys(destination.headers ?? {});
  const { form, isFormatAutoSwitched, leaving } = useDestinationForm({
    destination,
    presetKind: null,
  });
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const parsed = parseFlowIdFromUrl({
    url: destination.url,
    webhookPrefixUrl: webhookPrefixUrl ?? null,
  });
  const { data: handlerFlow } = flowHooks.useGetFlow({
    flowId: parsed.kind === 'flow' ? parsed.flowId : '',
    enabled: parsed.kind === 'flow',
  });
  const title = destinationSummary.title({
    destination,
    parsed,
    flowDisplayName: handlerFlow?.version.displayName,
  });
  const leaveForList = () => {
    leaving.current = true;
    navigate(EVENT_STREAMING_PATH);
  };

  const { mutate: saveDestination, isPending: isSaving } =
    eventDestinationsCollectionUtils.useSaveEventDestination({
      onSuccess: () => {
        toast.success(t('Destination saved'));
        leaveForList();
      },
      onError: (error) => {
        mutationFeedback.markShown(error);
        setSaveError(destinationErrors.describe(error));
      },
    });

  const handleSubmit = (values: DestinationFormValues) => {
    setSaveError(null);
    saveDestination({
      destinationId: destination.id,
      request: destinationFormUtils.toRequest(values),
    });
  };

  const watchedEvents = useWatch({ control: form.control, name: 'events' });
  const isDirty = form.formState.isDirty;

  return (
    <>
      <Form {...form}>
        <form
          className="contents"
          onSubmit={form.handleSubmit(handleSubmit, () =>
            setSaveError(t('Please fix the highlighted fields before saving')),
          )}
        >
          <Page
            width="narrow"
            footer={
              <SaveBar
                dirty={isDirty}
                saving={isSaving}
                error={isDirty ? saveError : null}
                onDiscard={() => {
                  form.reset();
                  setSaveError(null);
                }}
                saveLabel={t('Save changes')}
                saveControl={
                  AdminControl.EVENT_DESTINATIONS_DESTINATION_UPDATE_SUBMIT
                }
              />
            }
          >
            <PageHeader
              back={BACK_LINK()}
              title={title}
              description={[
                destinationSummary.formatLabel({
                  format: destination.format,
                  parsed,
                }),
                destination.enabled ? t('Enabled') : t('Paused'),
              ].join(' · ')}
            />
            <Panel
              title={t('Connection')}
              description={t(
                'Where events are sent, and the headers sent with them.',
              )}
            >
              <ConnectionStep
                form={form}
                isEdit={true}
                storedHeaderNames={storedHeaderNames}
                isFormatAutoSwitched={isFormatAutoSwitched}
              />
            </Panel>
            <Panel
              title={t('Events')}
              description={t('{selected} of {total} events selected', {
                selected: watchedEvents.length,
                total: eventGroupUtils.countEvents(),
              })}
            >
              <EventsStep form={form} />
            </Panel>
            <DangerZone
              actions={[
                {
                  title: t('Delete destination'),
                  description: t(
                    'Events stop going here. Saved header values cannot be recovered.',
                  ),
                  control: (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-danger-11 hover:text-danger-11"
                      {...adminControl(
                        AdminControl.EVENT_DESTINATIONS_DESTINATION_DELETE_OPEN,
                      )}
                      onClick={() => setDeleting(true)}
                    >
                      {t('Delete destination')}
                    </Button>
                  ),
                },
              ]}
            />
          </Page>
        </form>
      </Form>
      <UnsavedChangesGuard dirty={isDirty} standDown={leaving} />
      <DeleteDestinationDialog
        destination={destination}
        title={title}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={leaveForList}
      />
    </>
  );
};

function useDestinationForm({
  destination,
  presetKind,
}: {
  destination: EventDestination | null;
  presetKind: ReturnType<typeof destinationKinds.parse>;
}) {
  const storedHeaderNames = Object.keys(destination?.headers ?? {});
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(
      destinationFormUtils.buildFormSchema({
        storedHeaderNames,
        storedUrl: destination?.url ?? null,
      }),
    ),
    mode: 'onChange',
    defaultValues: destinationFormUtils.toDefaultValues({
      destination,
      kind: presetKind ?? 'otel',
    }),
  });
  const isFormatAutoSwitched = useRef(false);
  const leaving = useRef(false);
  return { form, isFormatAutoSwitched, leaving };
}

const StepHeader = ({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: { title: string; doneTitle: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) => {
  return (
    <ol className="flex items-center gap-3">
      {steps.map(({ title, doneTitle }, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const isLocked = index > activeIndex;
        return (
          <Fragment key={title}>
            <li>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg text-sm outline-hidden transition-colors focus-visible:ring-3 focus-visible:ring-gray-8/50',
                  isActive ? 'font-medium text-gray-12' : 'text-gray-11',
                  !isLocked && 'hover:text-gray-12',
                  isLocked && 'cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs',
                    isActive && 'bg-accent-9 text-on-accent',
                    isDone && 'bg-accent-3 text-accent-11',
                    !isActive && !isDone && 'border',
                  )}
                >
                  {isDone ? (
                    <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={cn(!isActive && 'sr-only sm:not-sr-only')}>
                  {isDone ? doneTitle : title}
                </span>
              </button>
            </li>
            {index < steps.length - 1 && (
              <li aria-hidden="true" className="h-px flex-1 bg-gray-6" />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
};

const BACK_LINK = () => ({
  label: t('Event streaming'),
  to: EVENT_STREAMING_PATH,
});

const STEP_COPY = () => [
  {
    title: t('Where should events go?'),
    description: t("This decides the format. You can't change it later."),
  },
  {
    title: t('Which events?'),
    description: t('Pick the audit events to send. Search, or pick a group.'),
  },
  {
    title: t('Connection'),
    description: t('Where events are sent, and the headers sent with them.'),
  },
];

const DESTINATION_STEP = 0;

const EVENTS_STEP = 1;

const CONNECTION_STEP = 2;

const STEP_COUNT = 3;

export default EventDestinationFormPage;
