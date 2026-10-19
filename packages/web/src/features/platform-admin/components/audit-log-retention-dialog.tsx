import { isNil } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { CirclePause, Clock, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { auditLogKeys, auditLogQueries } from '../hooks/audit-log-hooks';
import { auditLogRetentionUtils } from '../lib/audit-log-retention-utils';

export function AuditLogRetentionButton() {
  const [open, setOpen] = useState(false);
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: ceilingFlag } = flagsHooks.useFlag<number | null>(
    ApFlagId.AUDIT_LOG_RETENTION_DAYS,
  );
  const ceiling = ceilingFlag ?? null;
  const { data: pausedFlag } = flagsHooks.useFlag<boolean>(
    ApFlagId.AUDIT_LOG_RETENTION_PAUSED,
  );
  const savedDays = platform.auditLogRetentionDays ?? null;
  const currentDays = auditLogRetentionUtils.effectiveDays({
    days: savedDays,
    ceiling,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="size-4" />
          {t('Retention: {period}', {
            period: auditLogRetentionUtils.formatPeriod(currentDays),
          })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AuditLogRetentionForm
          key={open ? 'open' : 'closed'}
          platformId={platform.id}
          savedDays={savedDays}
          ceiling={ceiling}
          paused={pausedFlag === true}
          refetchPlatform={refetch}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AuditLogRetentionForm({
  platformId,
  savedDays,
  ceiling,
  paused,
  refetchPlatform,
  onClose,
}: AuditLogRetentionFormProps) {
  const options = auditLogRetentionUtils.buildOptions({ savedDays, ceiling });
  const initialValue = toOptionValue(
    auditLogRetentionUtils.initialSelection({ savedDays, ceiling }),
  );
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const selectedDays = fromOptionValue(selectedValue);
  const nextDays = auditLogRetentionUtils.effectiveDays({
    days: selectedDays,
    ceiling,
  });
  const currentDays = auditLogRetentionUtils.effectiveDays({
    days: savedDays,
    ceiling,
  });
  const deletesEvents = auditLogRetentionUtils.deletesEvents({
    next: nextDays,
    current: currentDays,
  });
  const now = new Date();
  const { data: oldestEventCreated } = auditLogQueries.useOldestEventCreated();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { auditLogRetentionDays: selectedDays },
        platformId,
      );
      await Promise.all([
        refetchPlatform(),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.root }),
      ]);
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      setTimeout(() => {
        queryClient
          .invalidateQueries({ queryKey: auditLogKeys.root })
          .catch(() => undefined);
      }, RETENTION_EVENT_REFRESH_DELAY_MS);
      onClose();
    },
    onError: () => {
      toast.error(t('Failed to save changes. Please try again.'));
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Audit log retention')}</DialogTitle>
        <DialogDescription>
          {t('Events older than the retention period are deleted every hour.')}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('Keep events for')}</span>
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((days) => (
              <SelectItem key={toOptionValue(days)} value={toOptionValue(days)}>
                {auditLogRetentionUtils.formatChoice({ days, ceiling })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {paused && (
        <Alert>
          <CirclePause className="size-4" />
          <AlertDescription>
            {t(
              'Cleanup is paused on this instance. No events are deleted until it resumes.',
            )}
          </AlertDescription>
        </Alert>
      )}
      {!isNil(oldestEventCreated) && (
        <p className="text-sm text-gray-11">
          {!paused &&
          auditLogRetentionUtils.isCleanupPending({
            oldestEventCreated,
            days: currentDays,
            now,
          })
            ? t(
                'Oldest event: {date}. Older events are still being deleted, in batches every hour.',
                {
                  date: formatUtils.formatDateOnly(
                    new Date(oldestEventCreated),
                  ),
                },
              )
            : t('Oldest event: {date}', {
                date: formatUtils.formatDateOnly(new Date(oldestEventCreated)),
              })}
        </p>
      )}
      {deletesEvents && !isNil(nextDays) && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertDescription>
            {t(
              'Events older than {period}, created before {date}, will be permanently deleted. This cannot be undone.',
              {
                period: auditLogRetentionUtils.formatPeriod(nextDays),
                date: formatUtils.formatDateOnly(
                  auditLogRetentionUtils.cutoffDate({ days: nextDays, now }),
                ),
              },
            )}
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          variant={deletesEvents ? 'destructive' : 'default'}
          disabled={selectedValue === initialValue || isPending}
          loading={isPending}
          onClick={() => mutate()}
        >
          {t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
}

function toOptionValue(days: number | null): string {
  return isNil(days) ? INSTANCE_OPTION_VALUE : String(days);
}

function fromOptionValue(value: string): number | null {
  return value === INSTANCE_OPTION_VALUE ? null : Number(value);
}

const INSTANCE_OPTION_VALUE = 'instance';
const RETENTION_EVENT_REFRESH_DELAY_MS = 1000;

type AuditLogRetentionFormProps = {
  platformId: string;
  savedDays: number | null;
  ceiling: number | null;
  paused: boolean;
  refetchPlatform: () => Promise<void>;
  onClose: () => void;
};
