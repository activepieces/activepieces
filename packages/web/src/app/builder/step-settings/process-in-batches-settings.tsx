import { isNil } from '@activepieces/core-utils';
import { ApFlagId, ProcessInBatchesAction } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Activity,
  CircleHelp,
  FlaskConical,
  TriangleAlert,
} from 'lucide-react';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { AdvancedSection } from '../piece-properties/advanced-section';
import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

import { BatchFailureModeField } from './batch-failure-mode-field';
import { processInBatchesUtils } from './process-in-batches-utils';

type ProcessInBatchesSettingsProps = {
  readonly: boolean;
};

const ProcessInBatchesSettings = React.memo(
  ({ readonly }: ProcessInBatchesSettingsProps) => {
    const form = useFormContext<ProcessInBatchesAction>();

    return (
      <>
        <FormField
          control={form.control}
          name="settings.items"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel showRequiredIndicator>
                {t('List to process')}
              </FormLabel>
              <TextInputWithMentions
                disabled={readonly}
                onChange={field.onChange}
                initialValue={field.value}
                placeholder={t('Select an array of items')}
              ></TextInputWithMentions>
              <FormDescription>
                {t(
                  'The list of items you want to work through — each batch takes a slice of it.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="settings.batchSize"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <FormLabel showRequiredIndicator>
                  {t('Items per Batch')}
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t('More info')}
                      className="flex shrink-0 rounded-sm text-gray-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {t(
                      'Every batch runs as its own flow run, and the step continues once all of them have finished.',
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  step={1}
                  className="w-24"
                  disabled={readonly}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                {t(
                  'Smaller batches finish faster, but send more requests to your apps at the same time. Larger batches are slower but gentler on them.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <BatchPlanSummary />
        <div className="flex items-start gap-2 text-xs text-gray-11">
          <Activity className="size-3.5 shrink-0 mt-0.5" />
          <span>
            {t(
              'Inside a batch, the items arrive as a list — loop over them to handle one at a time.',
            )}
          </span>
        </div>
        <AdvancedSection count={2} watchPaths={ADVANCED_WATCH_PATHS}>
          <BatchFailureModeField readonly={readonly} />
          <TimeoutField readonly={readonly} />
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              {t(
                'Retrying re-runs the whole list — anything a successful batch already sent happens again.',
              )}
            </AlertDescription>
          </Alert>
        </AdvancedSection>
      </>
    );
  },
);

const BatchPlanSummary = () => {
  const form = useFormContext<ProcessInBatchesAction>();
  const outputSampleData = useBuilderStateContext(
    (state) => state.outputSampleData,
  );
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: isRateLimiterEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PROJECT_RATE_LIMITER_ENABLED,
  );
  const items = useWatch({ control: form.control, name: 'settings.items' });
  const batchSize = useWatch({
    control: form.control,
    name: 'settings.batchSize',
  });

  const itemsCount = processInBatchesUtils.resolveItemsCount({
    items,
    outputSampleData,
  });
  const batchesCount = processInBatchesUtils.countBatches({
    itemsCount,
    batchSize,
  });
  const concurrencyLimit = processInBatchesUtils.resolveConcurrencyLimit({
    isRateLimiterEnabled,
    workerGroupsEnabled: platform.plan.workerGroupsEnabled,
    maxConcurrentJobs: project.maxConcurrentJobs,
  });

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center py-3">
        <PlanStat
          value={itemsCount}
          label={t('{count, plural, =1 {item} other {items}}', {
            count: itemsCount ?? 0,
          })}
        />
        <div className="w-px h-7 bg-gray-6 shrink-0" />
        <PlanStat value={batchSize ?? null} label={t('per batch')} />
        <div className="w-px h-7 bg-gray-6 shrink-0" />
        <PlanStat
          value={batchesCount}
          label={t('{count, plural, =1 {batch} other {batches}}', {
            count: batchesCount ?? 0,
          })}
          className="text-accent-11"
        />
      </div>
      {!isNil(concurrencyLimit) && (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs">
          <span className="font-medium">{t('Running at the same time')}</span>
          <span className="text-gray-11">
            {t("up to {limit} · your project's limit", {
              limit: concurrencyLimit,
            })}
          </span>
        </div>
      )}
      {itemsCount !== null && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-gray-11">
          <FlaskConical className="size-3 shrink-0" />
          <span>
            {t('Based on your last test run — updates when you test again')}
          </span>
        </div>
      )}
    </div>
  );
};

const PlanStat = ({
  value,
  label,
  className,
}: {
  value: number | null;
  label: string;
  className?: string;
}) => (
  <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
    <span className={cn('text-xl font-bold leading-none', className)}>
      {value === null ? '—' : value.toLocaleString()}
    </span>
    <span className="text-xs text-gray-11">{label}</span>
  </div>
);

const TimeoutField = ({ readonly }: ProcessInBatchesSettingsProps) => {
  const form = useFormContext<ProcessInBatchesAction>();
  const { data: maxPausedDays } = flagsHooks.useFlag<number>(
    ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
  );
  const maxHours = isNil(maxPausedDays) ? undefined : maxPausedDays * 24;

  return (
    <FormField
      control={form.control}
      name="settings.timeoutSeconds"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <FormLabel>{t('Give up waiting after')}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                type="number"
                min={1}
                max={maxHours}
                step={1}
                className="w-20"
                disabled={readonly}
                value={processInBatchesUtils.secondsToHours(field.value) ?? ''}
                onChange={(e) =>
                  field.onChange(
                    processInBatchesUtils.hoursToSeconds(
                      e.target.value === ''
                        ? undefined
                        : e.target.valueAsNumber,
                    ),
                  )
                }
              />
            </FormControl>
            <span className="text-sm text-gray-11">
              {t('{count, plural, =1 {hour} other {hours}}', {
                count: processInBatchesUtils.secondsToHours(field.value) ?? 0,
              })}
            </span>
          </div>
          <FormDescription>
            {isNil(maxPausedDays)
              ? t(
                  'The step stops waiting after this. Whether it fails or carries on with what finished follows If a batch fails above — either way the unfinished batches keep running on their own.',
                )
              : t(
                  'The step stops waiting after this. Whether it fails or carries on with what finished follows If a batch fails above — either way the unfinished batches keep running on their own. Leave empty to wait up to your deployment limit of {days} days.',
                  { days: maxPausedDays },
                )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const ADVANCED_WATCH_PATHS = ['settings.timeoutSeconds'];

ProcessInBatchesSettings.displayName = 'ProcessInBatchesSettings';
export { ProcessInBatchesSettings };
