import { isNil } from '@activepieces/core-utils';
import { EventDestination } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  adminActionCopy,
  adminFeedback,
  adminPageResources,
  SaveBar,
} from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SkeletonList } from '@/components/ui/skeleton';
import { AdminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

import { destinationErrors } from '../lib/destination-errors';
import {
  destinationFormUtils,
  DestinationFormValues,
} from '../lib/destination-form-utils';
import {
  DESTINATION_KIND_SEARCH_PARAM,
  destinationKinds,
} from '../lib/destination-kinds';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { eventGroupUtils } from '../lib/event-groups';
import { EVENT_STREAMING_PATH } from '../lib/event-streaming-path';

import { ConnectionStep } from './connection-step';
import { DestinationStep } from './destination-step';
import { EventsStep } from './events-step';

const EventDestinationFormPage = () => {
  const { id } = useParams<{ id: string }>();
  return isNil(id) ? (
    <DestinationForm destination={null} />
  ) : (
    <EditDestination key={id} destinationId={id} />
  );
};

const EditDestination = ({ destinationId }: { destinationId: string }) => {
  const opened =
    eventDestinationsCollectionUtils.useFreshDestination(destinationId);

  switch (opened.status) {
    case 'loading':
      return (
        <AdminPage width="content">
          <SkeletonList numberOfItems={4} className="h-18 w-full" />
        </AdminPage>
      );
    case 'error':
      return (
        <DataFetchErrorState
          entity={t('destination')}
          onRetry={eventDestinationsCollectionUtils.refetch}
        />
      );
    case 'missing':
      return <Navigate to={EVENT_STREAMING_PATH} replace />;
    case 'ready':
      return <DestinationForm destination={opened.destination} />;
  }
};

const DestinationForm = ({
  destination,
}: {
  destination: EventDestination | null;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !isNil(destination);
  const presetKind = destinationKinds.parse(
    searchParams.get(DESTINATION_KIND_SEARCH_PARAM),
  );
  const [stepIndex, setStepIndex] = useState(
    isEdit
      ? CONNECTION_STEP
      : isNil(presetKind)
      ? DESTINATION_STEP
      : EVENTS_STEP,
  );

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
  const leavingOnPurpose = useRef(false);
  const leaveAfterSave = () => {
    leavingOnPurpose.current = true;
    navigate(EVENT_STREAMING_PATH);
  };

  const { mutate: saveDestination, isPending: isSaving } =
    eventDestinationsCollectionUtils.useSaveEventDestination({
      onSuccess: () => {
        adminFeedback.done({
          verb: isEdit ? 'update' : 'create',
          name: t('Destination'),
        });
        leaveAfterSave();
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: adminActionCopy.failed({
            verb: isEdit ? 'update' : 'create',
            name: t('destination'),
          }),
          description: destinationErrors.describe(error),
        });
      },
    });

  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const goToStep = (index: number) => {
    setInvalidMessage(null);
    setStepIndex(index);
  };
  useEffect(() => {
    const subscription = form.watch(() => setInvalidMessage(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (values: DestinationFormValues) => {
    setInvalidMessage(null);
    saveDestination({
      destinationId: destination?.id ?? null,
      request: destinationFormUtils.toRequest(values),
    });
  };

  const handleInvalidSubmit = (errors: FieldErrors<DestinationFormValues>) => {
    setStepIndex(isNil(errors.events) ? CONNECTION_STEP : EVENTS_STEP);
    setInvalidMessage(t('Please fix the highlighted fields before saving'));
  };

  const goToNextStep = async () => {
    if (stepIndex === CONNECTION_STEP) {
      return;
    }
    if (stepIndex === EVENTS_STEP && !(await form.trigger('events'))) {
      return;
    }
    goToStep(stepIndex + 1);
  };

  const watchedEvents = useWatch({ control: form.control, name: 'events' });
  const watchedFormat = useWatch({ control: form.control, name: 'format' });
  const selectedKind = destinationKinds.kindOf(watchedFormat);
  const selectedKindTitle =
    destinationKinds
      .buildOptions()
      .find((option) => option.kind === selectedKind)?.shortTitle ?? '';
  const isLastStep = stepIndex === CONNECTION_STEP;
  const showSubmit = isEdit || isLastStep;
  const footerStatus =
    stepIndex === EVENTS_STEP
      ? t('{selected} of {total} events selected', {
          selected: watchedEvents.length,
          total: eventGroupUtils.countEvents(),
        })
      : t('Step {current} of {total}', {
          current: stepIndex + 1,
          total: STEP_COUNT,
        });

  return (
    <AdminPage
      width="content"
      footer={
        <SaveBar
          width="content"
          dirty={form.formState.isDirty}
          saveEnabled={isEdit || isLastStep}
          announceStatus={false}
          saving={isSaving}
          showSave={showSubmit}
          status={
            <span className="min-w-0 text-sm text-gray-11">{footerStatus}</span>
          }
          error={invalidMessage}
          onSave={form.handleSubmit(handleSubmit, handleInvalidSubmit)}
          saveLabel={isEdit ? t('Save changes') : t('Create destination')}
          saveControl={
            isEdit
              ? AdminControl.EVENT_DESTINATIONS_DESTINATION_UPDATE_SUBMIT
              : AdminControl.EVENT_DESTINATIONS_DESTINATION_CREATE_SUBMIT
          }
          standDown={leavingOnPurpose}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(EVENT_STREAMING_PATH)}
            disabled={isSaving}
          >
            {t('Cancel')}
          </Button>
          {!isEdit && stepIndex > DESTINATION_STEP && (
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(stepIndex - 1)}
            >
              {t('Back')}
            </Button>
          )}
          {!isEdit && !isLastStep && (
            <Button type="button" onClick={goToNextStep}>
              {t('Continue')}
            </Button>
          )}
        </SaveBar>
      }
    >
      <AdminPageHeader
        back={{ label: t('Event Streaming'), to: EVENT_STREAMING_PATH }}
        title={isEdit ? t('Edit destination') : t('New destination')}
        resources={adminPageResources.eventStreaming}
      />
      <Form {...form}>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <StepHeader
            steps={[
              {
                title: t('Destination'),
                doneTitle: selectedKindTitle,
              },
              { title: t('Events'), doneTitle: t('Events') },
              { title: t('Connection'), doneTitle: t('Connection') },
            ]}
            activeIndex={stepIndex}
            canJump={isEdit}
            onSelect={goToStep}
          />
          {stepIndex === DESTINATION_STEP && (
            <DestinationStep form={form} isEdit={isEdit} />
          )}
          {stepIndex === EVENTS_STEP && <EventsStep form={form} />}
          {stepIndex === CONNECTION_STEP && (
            <ConnectionStep
              form={form}
              isEdit={isEdit}
              storedHeaderNames={storedHeaderNames}
              isFormatAutoSwitched={isFormatAutoSwitched}
            />
          )}
        </form>
      </Form>
    </AdminPage>
  );
};

const StepHeader = ({
  steps,
  activeIndex,
  canJump,
  onSelect,
}: {
  steps: { title: string; doneTitle: string }[];
  activeIndex: number;
  canJump: boolean;
  onSelect: (index: number) => void;
}) => {
  return (
    <ol className="flex items-center gap-3">
      {steps.map(({ title, doneTitle }, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const isLocked = !canJump && index > activeIndex;
        return (
          <Fragment key={title}>
            <li>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
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
                    <Check className="size-3.5" strokeWidth={3} />
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

const DESTINATION_STEP = 0;

const EVENTS_STEP = 1;

const CONNECTION_STEP = 2;

const STEP_COUNT = 3;

export default EventDestinationFormPage;
