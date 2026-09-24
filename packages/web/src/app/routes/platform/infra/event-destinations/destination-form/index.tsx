import { isNil } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  EventDestination,
  EventDestinationFormat,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { CenteredPage } from '@/app/components/centered-page';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SkeletonList } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import {
  destinationFormUtils,
  DestinationFormValues,
} from '../lib/destination-form-utils';
import {
  DESTINATION_KIND_SEARCH_PARAM,
  destinationKinds,
} from '../lib/destination-kinds';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { buildEventGroups } from '../lib/event-groups';

import { ConnectionStep } from './connection-step';
import { DestinationStep } from './destination-step';
import { EventsStep } from './events-step';

const LISTING_PATH = '/platform/security?tab=events';

const EventDestinationFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.eventStreamingEnabled;
  const { data: destinations, isLoading } =
    eventDestinationsCollectionUtils.useAll(isEnabled);

  const destination = isNil(id)
    ? null
    : destinations.find((candidate) => candidate.id === id);

  return (
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Streaming')}
      lockDescription={t(
        'Stream every audit event in OpenTelemetry (OTLP) format to Datadog, PostHog, Grafana Loki, or any OTLP backend. Or send it as raw JSON to a webhook or a handler flow.',
      )}
      lockDocumentationUrl={EVENT_STREAMING_DOCUMENTATION_URL}
    >
      {!isNil(id) && isLoading && (
        <div className="w-full mx-auto py-6 px-6">
          <SkeletonList numberOfItems={4} className="w-full h-[72px]" />
        </div>
      )}
      {!isNil(id) && !isLoading && isNil(destination) && (
        <Navigate to={LISTING_PATH} replace />
      )}
      {(isNil(id) || !isNil(destination)) && (
        <DestinationForm destination={destination ?? null} />
      )}
    </LockedFeatureGuard>
  );
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

  const formSchema = z
    .object({
      url: z.url(t('Invalid URL')).min(1, t('Webhook URL is required')),
      events: z
        .array(z.enum(ApplicationEventName))
        .min(1, t('Select at least one event')),
      headers: z.record(z.string(), z.string()),
      format: z.enum(EventDestinationFormat),
    })
    .superRefine((values, ctx) => {
      if (isNil(destination) || values.url === destination.url) {
        return;
      }
      Object.entries(values.headers).forEach(([key, value]) => {
        if (key === '' || value !== '') {
          return;
        }
        ctx.addIssue({
          code: 'custom',
          path: ['headers', key],
          message: t('Re-enter this value to change the URL'),
        });
      });
    });

  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: destinationFormUtils.toDefaultValues({
      destination,
      kind: presetKind ?? 'otel',
    }),
  });

  const { mutate: createDestination, isPending: isCreating } =
    eventDestinationsCollectionUtils.useCreateEventDestination(
      () => {
        toast.success(t('Success'), {
          description: t('Destination created successfully'),
        });
        navigate(LISTING_PATH);
      },
      (error: Error) => {
        toast.error(t('Error'), { description: error.message });
      },
    );

  const { mutate: updateDestination, isPending: isUpdating } =
    eventDestinationsCollectionUtils.useUpdateEventDestination(
      () => {
        toast.success(t('Success'), {
          description: t('Destination updated successfully'),
        });
        navigate(LISTING_PATH);
      },
      (error: Error) => {
        toast.error(t('Error'), { description: error.message });
      },
    );

  const isSaving = isCreating || isUpdating;

  const handleSubmit = (values: DestinationFormValues) => {
    const request = destinationFormUtils.toRequest(values);
    if (isNil(destination)) {
      createDestination(request);
      return;
    }
    updateDestination({ destinationId: destination.id, request });
  };

  const handleInvalidSubmit = () => {
    toast.error(t('Error'), {
      description: t('Please fix the highlighted fields before saving'),
    });
  };

  const goToNextStep = async () => {
    if (stepIndex === CONNECTION_STEP) {
      return;
    }
    if (stepIndex === EVENTS_STEP && !(await form.trigger('events'))) {
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  const watchedEvents = useWatch({ control: form.control, name: 'events' });
  const watchedFormat = useWatch({ control: form.control, name: 'format' });
  const watchedUrl = useWatch({ control: form.control, name: 'url' });
  const selectedKind = destinationKinds.kindOf(watchedFormat);
  const selectedKindTitle =
    destinationKinds
      .buildOptions()
      .find((option) => option.kind === selectedKind)?.shortTitle ?? '';
  const totalEventCount = buildEventGroups().reduce(
    (total, group) => total + group.events.length,
    0,
  );
  const isLastStep = stepIndex === CONNECTION_STEP;
  const showSubmit = isEdit || isLastStep;
  const footerStatus =
    stepIndex === EVENTS_STEP
      ? t('{selected} of {total} events selected', {
          selected: watchedEvents.length,
          total: totalEventCount,
        })
      : t('Step {current} of {total}', {
          current: stepIndex + 1,
          total: STEP_COUNT,
        });

  return (
    <CenteredPage
      widthClassName="max-w-full px-6"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={LISTING_PATH}>{t('Event Streaming')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEdit ? t('Edit destination') : t('New destination')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      title={isEdit ? t('Edit destination') : t('New destination')}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(LISTING_PATH)}
            disabled={isSaving}
          >
            {t('Cancel')}
          </Button>
          <span className="flex-1" />
          <span className="self-center pr-2 text-sm text-muted-foreground">
            {footerStatus}
          </span>
          {!isEdit && stepIndex > DESTINATION_STEP && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex(stepIndex - 1)}
            >
              {t('Back')}
            </Button>
          )}
          {!isEdit && !isLastStep && (
            <Button type="button" onClick={goToNextStep}>
              {t('Continue')}
            </Button>
          )}
          {showSubmit && (
            <Button
              type="button"
              loading={isSaving}
              disabled={isSaving || watchedUrl === ''}
              onClick={form.handleSubmit(handleSubmit, handleInvalidSubmit)}
            >
              {isEdit ? t('Save changes') : t('Create destination')}
            </Button>
          )}
        </>
      }
    >
      <Form {...form}>
        <form className="flex max-w-[50rem] flex-col gap-6">
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
            onSelect={setStepIndex}
          />
          {stepIndex === DESTINATION_STEP && (
            <DestinationStep form={form} isEdit={isEdit} />
          )}
          {stepIndex === EVENTS_STEP && <EventsStep form={form} />}
          {stepIndex === CONNECTION_STEP && (
            <ConnectionStep form={form} isEdit={isEdit} />
          )}
        </form>
      </Form>
    </CenteredPage>
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
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                  !isLocked && 'hover:text-foreground',
                  isLocked && 'cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs',
                    isActive && 'bg-primary text-primary-foreground',
                    isDone && 'bg-primary/10 text-primary',
                    !isActive && !isDone && 'border',
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                {isDone ? doneTitle : title}
              </button>
            </li>
            {index < steps.length - 1 && (
              <li aria-hidden="true" className="h-px flex-1 bg-border" />
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

const EVENT_STREAMING_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/admin-guide/guides/event-streaming';

export default EventDestinationFormPage;
