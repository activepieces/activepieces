import { isNil } from '@activepieces/core-utils';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Check,
  FileClock,
  Globe,
  KeyRound,
  LucideIcon,
  Palette,
  Rocket,
  ShieldCheck,
  UserCog,
  Code,
  Vault,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { useEnterpriseTrialDialogStore } from '../stores/enterprise-trial-dialog-state';
import { billingUtils } from '../utils/billing-utils';

import { EnterpriseTrialEndedDialog } from './enterprise-trial-ended-dialog';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialDialog() {
  const { payload, closeDialog } = useEnterpriseTrialDialogStore();
  enterpriseTrialHooks.useStatus();
  const start = enterpriseTrialHooks.useStart();
  const open = !isNil(payload);
  const result = start.data?.state;
  const close = () => {
    closeDialog();
    start.reset();
  };
  return (
    <>
      <EnterpriseTrialEndedDialog />
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            isNil(result)
              ? 'max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl sm:rounded-2xl'
              : 'p-6 sm:max-w-md sm:rounded-2xl',
          )}
        >
          {open && result === 'active' && (
            <TrialStarted endsAt={start.data?.endsAt ?? null} onClose={close} />
          )}
          {open && (result === 'used' || result === 'ended') && (
            <TrialAlreadyUsed />
          )}
          {open && (result === 'unavailable' || result === 'eligible') && (
            <TrialNotStarted onClose={close} />
          )}
          {open && isNil(result) && (
            <StartTrial
              isPending={start.isPending}
              isError={start.isError}
              onStart={() =>
                start.mutate(undefined, {
                  onSuccess: (status) => {
                    if (status.state === 'active') {
                      celebrate();
                    }
                  },
                })
              }
              onClose={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StartTrial({
  isPending,
  isError,
  onStart,
  onClose,
}: {
  isPending: boolean;
  isError: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  const { creditsRemaining } = useCreditsUsage();
  const trial = enterpriseTrialHooks.useTrial();
  const endDate = dayjs().add(ENTERPRISE_TRIAL_DAYS, 'day');
  const stats = [
    {
      value: t('{days} days', { days: ENTERPRISE_TRIAL_DAYS }),
      label: t('free, no card'),
    },
    { value: t('Unlimited'), label: t('users and team projects') },
    {
      value: isNil(creditsRemaining)
        ? t('Unchanged')
        : billingUtils.formatCredits(creditsRemaining),
      label: t('credits, unchanged'),
    },
  ];
  const timeline = [
    {
      title: t('Today'),
      description: t('Every Enterprise feature unlocks.'),
    },
    {
      title: endDate.subtract(1, 'day').format('MMM D'),
      description: t('We email you a reminder.'),
    },
    {
      title: endDate.format('MMM D'),
      description: t('The trial ends and you are back on {plan}.', {
        plan: trial.basePlanName,
      }),
    },
  ];

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="flex flex-col p-6 sm:p-8">
        <div className="flex flex-col gap-2 pr-6">
          <DialogTitle className="text-lg font-semibold">
            {t('Try Enterprise free for 7 days')}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {t(
              'Turn on every Enterprise feature for your whole platform. No card needed, and nothing to cancel.',
            )}
          </DialogDescription>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-6 border-y py-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <dt className="order-2 text-xs text-gray-11">{stat.label}</dt>
              <dd className="order-1 text-base font-semibold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <span className="mt-6 text-sm font-medium">{t('What you get')}</span>
        <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-sm">
              <item.icon className="size-4 shrink-0 text-gray-9" />
              <span>{t(item.label)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-auto flex items-start gap-2 pt-8 text-xs text-gray-11">
          <ShieldCheck className="mt-px size-4 shrink-0" />
          {t(
            'Your flows, connections and data stay exactly as they are. Nothing is deleted when the trial ends.',
          )}
        </p>
      </div>
      <aside className="flex flex-col border-t bg-gray-2 p-6 sm:p-8 md:border-t-0 md:border-l">
        <span className="text-sm font-medium">{t('How it works')}</span>
        <ol className="mt-4 flex flex-col">
          {timeline.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    index === 0 ? 'bg-accent-9' : 'bg-gray-8',
                  )}
                />
                {index < timeline.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-gray-6" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 pb-4">
                <span className="text-sm font-medium">{step.title}</span>
                <span className="text-xs text-gray-11">{step.description}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-auto flex flex-col gap-2 pt-4">
          {isError && (
            <p className="text-xs text-danger-11">
              {t('We could not start your trial. Please try again.')}
            </p>
          )}
          <Button
            size="lg"
            className="w-full"
            loading={isPending}
            onClick={onStart}
          >
            {t('Start free trial')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onClose}
          >
            {t('Not now')}
          </Button>
        </div>
      </aside>
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
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-success-9">
        <Check className="size-6 text-on-success" strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-base font-semibold">
          {t('Your Enterprise trial has started')}
        </DialogTitle>
        <DialogDescription className="text-pretty">
          {isNil(endsAt)
            ? t('Every Enterprise feature is now unlocked.')
            : t(
                'Every Enterprise feature is unlocked until {date}. You will see the end date on your credits card in the sidebar, and we will remind you the day before.',
                { date: dayjs(endsAt).format('MMM D') },
              )}
        </DialogDescription>
      </div>
      <Button className="w-full" onClick={onClose}>
        {t('Got it')}
      </Button>
    </div>
  );
}

function TrialAlreadyUsed() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pr-6">
        <DialogTitle className="text-base font-semibold">
          {t('Your Enterprise trial was already used')}
        </DialogTitle>
        <DialogDescription>
          {t(
            'Each platform owner can start the Enterprise trial once. Talk to our team to get more time.',
          )}
        </DialogDescription>
      </div>
      <div className="flex justify-end">
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_used"
          variant="default"
          label={t('Talk to sales')}
        />
      </div>
    </div>
  );
}

function TrialNotStarted({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pr-6">
        <DialogTitle className="text-base font-semibold">
          {t('We could not start your trial')}
        </DialogTitle>
        <DialogDescription>
          {t(
            'The Enterprise trial is not available for your platform right now. Please try again later, or talk to our team.',
          )}
        </DialogDescription>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          {t('Close')}
        </Button>
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_unavailable"
          variant="default"
          label={t('Talk to sales')}
        />
      </div>
    </div>
  );
}

function celebrate(): void {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })?.catch(
    () => undefined,
  );
}

const INCLUDED: { icon: LucideIcon; label: string }[] = [
  { icon: KeyRound, label: 'SSO and SCIM' },
  { icon: UserCog, label: 'Custom roles' },
  { icon: FileClock, label: 'Audit logs' },
  { icon: Rocket, label: 'Releases' },
  { icon: Vault, label: 'Secret managers' },
  { icon: Globe, label: 'Global connections' },
  { icon: Code, label: 'Embedding' },
  { icon: Palette, label: 'White-labelling' },
];
