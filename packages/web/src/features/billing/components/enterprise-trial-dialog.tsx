import { isNil } from '@activepieces/core-utils';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Bell,
  CalendarCheck,
  Check,
  LockOpen,
  LucideIcon,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useEnterpriseTrialDialogStore } from '../stores/enterprise-trial-dialog-state';

import { EnterpriseTrialEndedDialog } from './enterprise-trial-ended-dialog';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialDialog() {
  const { payload, closeDialog } = useEnterpriseTrialDialogStore();
  enterpriseTrialHooks.useStatus();
  const open = !isNil(payload);
  return (
    <>
      <EnterpriseTrialEndedDialog />
      <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
        <DialogContent className="max-w-lg">
          {open && (
            <EnterpriseTrialDialogBody key="open" onClose={closeDialog} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EnterpriseTrialDialogBody({ onClose }: { onClose: () => void }) {
  const { mutate, data, isPending, isError } = enterpriseTrialHooks.useStart();
  const timeline = buildTimeline();

  if (data?.state === 'active') {
    return <TrialStarted endsAt={data.endsAt} onClose={onClose} />;
  }

  if (data?.state === 'used') {
    return (
      <div className="flex flex-col gap-4">
        <DialogTitle>{t('Your Enterprise trial was already used')}</DialogTitle>
        <DialogDescription>
          {t(
            'Each platform owner can start the Enterprise trial once. Talk to our team to get more time.',
          )}
        </DialogDescription>
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_used"
          label={t('Talk to sales')}
          className="self-start"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-xl">
          {t('Try Enterprise free for 7 days')}
        </DialogTitle>
        <DialogDescription>
          {t('No credit card needed, and nothing to cancel.')}
        </DialogDescription>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" />
            {t('Enterprise')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('Free for 7 days')}
          </span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{t(item)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ol className="flex flex-col">
        {timeline.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-background">
                <step.icon className="size-3.5 text-muted-foreground" />
              </span>
              {index < timeline.length - 1 && (
                <span className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-4">
              <span className="text-sm font-medium">{step.title}</span>
              <span className="text-sm text-muted-foreground">
                {step.description}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {isError && (
        <p className="text-sm text-destructive">
          {t('We could not start your trial. Please try again.')}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button
          loading={isPending}
          onClick={() =>
            mutate(undefined, {
              onSuccess: (status) => {
                if (status.state === 'active') {
                  celebrate();
                }
              },
            })
          }
        >
          {t('Start free trial')}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t('Not now')}
        </Button>
      </div>
    </div>
  );
}

function TrialStarted({
  endsAt,
  onClose,
}: {
  endsAt: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="grid size-12 place-items-center rounded-full bg-success-600">
        <Check className="size-6 text-white" strokeWidth={3} />
      </span>
      <DialogTitle className="text-xl">
        {t('Your Enterprise trial has started')}
      </DialogTitle>
      <DialogDescription>
        {isNil(endsAt)
          ? t('Every Enterprise feature is now unlocked.')
          : t('Every Enterprise feature is unlocked until {date}.', {
              date: dayjs(endsAt).format('MMM D, YYYY'),
            })}
      </DialogDescription>
      <Button className="self-start" onClick={onClose}>
        {t('Start exploring')}
      </Button>
    </div>
  );
}

function buildTimeline(): TimelineStep[] {
  const format = (days: number) => dayjs().add(days, 'day').format('MMM D');
  return [
    {
      icon: LockOpen,
      title: t('Today'),
      description: t(
        'Every Enterprise feature unlocks, with unlimited users and team projects. Your AI credits stay the same.',
      ),
    },
    {
      icon: Bell,
      title: format(TRIAL_DAYS - 1),
      description: t('We email you a reminder the day before it ends.'),
    },
    {
      icon: CalendarCheck,
      title: format(TRIAL_DAYS),
      description: t(
        'The trial ends and Enterprise features switch off. Nothing is deleted.',
      ),
    },
  ];
}

function celebrate(): void {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })?.catch(
    () => undefined,
  );
}

const TRIAL_DAYS = 7;

const INCLUDED = [
  'SSO, SCIM and custom roles',
  'Audit logs, secret managers and releases',
  'Global connections, embedding and white-labelling',
  'Unlimited users and team projects',
];

type TimelineStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};
