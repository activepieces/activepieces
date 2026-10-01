import { isNil } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Clock, TriangleAlert } from 'lucide-react';
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

import { auditLogRetentionUtils } from '../lib/audit-log-retention-utils';

export function AuditLogRetentionButton() {
  const [open, setOpen] = useState(false);
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: ceilingFlag } = flagsHooks.useFlag<number | null>(
    ApFlagId.AUDIT_LOG_RETENTION_DAYS,
  );
  const ceiling = ceilingFlag ?? null;
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
          {t('Retention: {period}', { period: formatPeriod(currentDays) })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AuditLogRetentionForm
          key={open ? 'open' : 'closed'}
          platformId={platform.id}
          savedDays={savedDays}
          ceiling={ceiling}
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
  const deletesEvents = auditLogRetentionUtils.deletesEvents({
    next: nextDays,
    current: auditLogRetentionUtils.effectiveDays({ days: savedDays, ceiling }),
  });
  const canChoose = options.length > 1;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { auditLogRetentionDays: selectedDays },
        platformId,
      );
      await refetchPlatform();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
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
      {canChoose ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('Keep events for')}</span>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((days) => (
                <SelectItem
                  key={toOptionValue(days)}
                  value={toOptionValue(days)}
                >
                  {formatOption({ days, ceiling })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="text-sm">
          {t('Instance limit: {period}', { period: formatPeriod(ceiling) })}
        </p>
      )}
      {deletesEvents && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertDescription>
            {t(
              'Events older than {period} will be permanently deleted. This cannot be undone.',
              { period: formatPeriod(nextDays) },
            )}
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        {canChoose && (
          <Button
            type="button"
            variant={deletesEvents ? 'destructive' : 'default'}
            disabled={selectedValue === initialValue || isPending}
            loading={isPending}
            onClick={() => mutate()}
          >
            {t('Save')}
          </Button>
        )}
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

function formatOption({
  days,
  ceiling,
}: {
  days: number | null;
  ceiling: number | null;
}): string {
  if (!isNil(days)) {
    return formatPeriod(days);
  }
  return isNil(ceiling)
    ? t('Forever')
    : t('Instance limit ({period})', { period: formatPeriod(ceiling) });
}

function formatPeriod(days: number | null): string {
  if (isNil(days)) {
    return t('Forever');
  }
  if (days === 180) {
    return t('6 months');
  }
  if (days === 365) {
    return t('1 year');
  }
  return t('retentionPeriodDays', { days });
}

const INSTANCE_OPTION_VALUE = 'instance';

type AuditLogRetentionFormProps = {
  platformId: string;
  savedDays: number | null;
  ceiling: number | null;
  refetchPlatform: () => Promise<void>;
  onClose: () => void;
};
