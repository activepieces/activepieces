import { isNil } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  DestinationType,
  EventDestination,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

import { ConnectionStep } from './connection-step';
import { EventsStep } from './events-step';
import { MappingStep } from './mapping-step';

const LISTING_PATH = '/platform/infrastructure/event-destinations';

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
        'Forward every audit event we emit to a webhook, then handle it in a flow — wire it to Slack, Gmail, PagerDuty, or anywhere else.',
      )}
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
  const isEdit = !isNil(destination);
  const [stepIndex, setStepIndex] = useState(0);
  const [mapperKey, setMapperKey] = useState(0);

  const formSchema = z
    .object({
      name: z.string(),
      type: z.enum(DestinationType),
      url: z.url(t('Invalid URL')).min(1, t('Webhook URL is required')),
      events: z
        .array(z.enum(ApplicationEventName))
        .min(1, t('Select at least one event')),
      headers: z.record(z.string(), z.string()),
      mapper: z
        .unknown()
        .refine(
          (value) =>
            isNil(value) ||
            value === '' ||
            (typeof value === 'object' && !Array.isArray(value)),
          t('Payload template must be valid JSON'),
        ),
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
    defaultValues: destinationFormUtils.toDefaultValues(destination),
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
    if (stepIndex === STEP_COUNT - 1) {
      return;
    }
    if (stepIndex === 1) {
      const isUrlValid = await form.trigger('url');
      if (!isUrlValid) {
        setStepIndex(0);
        return;
      }
      if (!(await form.trigger('events'))) {
        return;
      }
    }
    setStepIndex(stepIndex + 1);
  };

  const replaceMapper = (mapper: unknown) => {
    form.setValue('mapper', mapper ?? {}, { shouldValidate: true });
    setMapperKey((current) => current + 1);
  };

  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedEvents = useWatch({ control: form.control, name: 'events' });
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const showSubmit = isEdit || isLastStep;

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
      description={t(
        'Stream audit events to an external log or analytics tool over HTTP.',
      )}
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
          {!isEdit && stepIndex > 0 && (
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
              disabled={isSaving}
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
              { title: t('Connection'), subtitle: watchedName },
              {
                title: t('Events'),
                subtitle:
                  watchedEvents.length === 0
                    ? ''
                    : t('{count} selected', { count: watchedEvents.length }),
              },
              { title: t('Mapping'), subtitle: '' },
            ]}
            activeIndex={stepIndex}
            canJump={isEdit}
            onSelect={setStepIndex}
          />
          {stepIndex === 0 && (
            <ConnectionStep
              form={form}
              isEdit={isEdit}
              onPresetPicked={replaceMapper}
            />
          )}
          {stepIndex === 1 && <EventsStep form={form} />}
          {stepIndex === 2 && (
            <MappingStep
              form={form}
              mapperKey={mapperKey}
              onMapperReplaced={replaceMapper}
            />
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
  steps: { title: string; subtitle: string }[];
  activeIndex: number;
  canJump: boolean;
  onSelect: (index: number) => void;
}) => {
  return (
    <ol className="flex items-center gap-2">
      {steps.map(({ title, subtitle }, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <li key={title} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canJump && index > activeIndex}
              onClick={() => onSelect(index)}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
                isActive && 'font-medium text-foreground',
                !isActive && 'text-muted-foreground',
                (canJump || index <= activeIndex) && 'hover:text-foreground',
                !canJump && index > activeIndex && 'cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-xs',
                  isActive &&
                    'border-transparent bg-primary text-primary-foreground',
                  isDone && 'border-transparent bg-primary/10 text-primary-300',
                )}
              >
                {isDone ? <Check className="size-3" /> : index + 1}
              </span>
              {title}
              {isDone && subtitle !== '' && (
                <span className="max-w-40 truncate text-muted-foreground">
                  · {subtitle}
                </span>
              )}
            </button>
            {index < steps.length - 1 && (
              <span className="h-px w-6 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const STEP_COUNT = 3;

export default EventDestinationFormPage;
