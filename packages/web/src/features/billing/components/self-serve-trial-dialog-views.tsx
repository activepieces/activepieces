import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformAdminSurface } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  CircleAlert,
  ChevronDown,
  LoaderCircle,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { usePlanThatHasFeature } from '../hooks/billing-hooks';
import {
  selfServeTrialHooks,
  ActionWhenLocked,
  useActionWhenLocked,
} from '../hooks/self-serve-trial-hooks';
import { enterpriseMotion } from '../utils/billing-utils';
import { platformFeatures, FeatureKey } from '../utils/platform-features';
import { selfServeTrialFeatures } from '../utils/self-serve-trial-utils';

import { SelfServeTrialSalesLink } from './current-subscription-card';
import { PlanBadge, SelfServeTrialLockedActions } from './locked-feature';
import { ResumeState, TrialTimeline } from './self-serve-trial-dialog';

export function IncludedFeatures({
  featureKey,
}: {
  featureKey: FeatureKey | undefined;
}) {
  const features = selfServeTrialFeatures.list();
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {features.map((feature) => {
        const highlighted =
          featureKey !== undefined && feature.featureKeys.includes(featureKey);
        return (
          <li key={feature.title} className="flex items-start gap-2.5">
            <feature.icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                highlighted ? 'text-accent-11' : 'text-gray-9',
              )}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-12">
                {feature.title}
              </span>
              <span className="text-sm leading-relaxed text-gray-11">
                {feature.benefit}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function LockedFeature({
  featureKey,
  onAction,
}: {
  featureKey: FeatureKey | undefined;
  onAction: () => void;
}) {
  const actionWhenLocked = useActionWhenLocked();
  const plan = usePlanThatHasFeature(featureKey);
  const copy = selfServeTrialFeatures.lockedCopy(featureKey);
  const headline =
    copy?.headline ??
    selfServeTrialFeatures.name(featureKey) ??
    t('The Enterprise plan for your whole team');
  const description =
    copy?.description ??
    t(
      'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform.',
    );
  const benefits = copy?.benefits ?? [];

  return (
    <DialogFrame
      eyebrow={<PlanBadge featureKey={featureKey} />}
      title={headline}
      description={description}
      mainTitle={t('What you get')}
      main={
        benefits.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
                <span className="text-gray-12">{benefit}</span>
              </li>
            ))}
          </ul>
        ) : (
          <IncludedFeatures featureKey={featureKey} />
        )
      }
      asideTitle={t('How to get it')}
      aside={
        <p className="text-sm leading-relaxed text-gray-11">
          {howToGetIt({
            actionWhenLocked,
            planThatHasFeature: plan.planThatHasFeature,
          })}
        </p>
      }
      actions={
        <SelfServeTrialLockedActions
          featureKey={featureKey}
          surface={PlatformAdminSurface.DIALOG}
          onAction={onAction}
        />
      }
    />
  );
}

export function DialogFrame({
  eyebrow,
  title,
  description,
  note,
  mainTitle,
  main,
  asideTitle,
  aside,
  footerNote,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: ReactNode;
  note?: ReactNode;
  mainTitle?: string;
  main?: ReactNode;
  asideTitle?: string;
  aside?: ReactNode;
  footerNote?: ReactNode;
  actions: ReactNode;
}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const moreBelow = useMoreBelow(scroller);
  return (
    <>
      <div
        ref={setScroller}
        tabIndex={0}
        role="region"
        aria-label={title}
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-8"
      >
        <div className="flex flex-col items-start gap-2 px-7 pt-7 pb-6 pr-14">
          {eyebrow}
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-pretty">
            {description}
          </DialogDescription>
          {note}
        </div>
        {(main || aside) && (
          <div className="grid border-t md:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4 px-7 py-6">
              <span className="text-sm font-medium text-gray-12">
                {mainTitle}
              </span>
              {main}
            </div>
            <aside className="flex flex-col gap-4 border-t px-7 py-6 md:border-t-0 md:border-l">
              <span className="text-sm font-medium text-gray-12">
                {asideTitle}
              </span>
              {aside}
            </aside>
          </div>
        )}
        {moreBelow && (
          <div className="pointer-events-none sticky bottom-0 flex justify-center pb-3">
            <span className="flex items-center gap-1 rounded-full border bg-gray-1 px-2.5 py-1 text-xs text-gray-11 shadow-sm">
              <ChevronDown className="size-3.5" />
              {t('More below')}
            </span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col-reverse items-stretch gap-3 border-t px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex flex-wrap items-center gap-1 text-sm text-gray-11">
          {footerNote}
        </span>
        <div className="flex justify-end">{actions}</div>
      </div>
    </>
  );
}

function howToGetIt({
  actionWhenLocked,
  planThatHasFeature,
}: {
  actionWhenLocked: ActionWhenLocked;
  planThatHasFeature: PlanName;
}): string {
  switch (actionWhenLocked) {
    case ActionWhenLocked.ASK_ADMIN:
      return platformFeatures.askAdminToUpgradeText(planThatHasFeature);
    case ActionWhenLocked.SWITCH_EDITION:
      return t(
        'This needs the Enterprise edition. Our team can set you up with a license.',
      );
    case ActionWhenLocked.UPGRADE_AFTER_TRIAL:
      return t(
        'Your Enterprise plan trial was already used. Our team can extend it or set you up on a plan.',
      );
    case ActionWhenLocked.START_TRIAL:
    case ActionWhenLocked.UPGRADE:
      return planThatHasFeature === PlanName.ENTERPRISE
        ? t(
            'Our team sets you up on the Enterprise plan and helps with the rollout.',
          )
        : t(
            'Upgrade from the plans page whenever you are ready. Your flows and settings stay as they are.',
          );
  }
}

export function TrialStarted({
  endsAt,
  startedAt,
  featureKey,
  resumeState,
  onRetry,
  onClose,
}: {
  endsAt: string | null;
  startedAt: string | null;
  featureKey: FeatureKey | undefined;
  resumeState: ResumeState;
  onRetry: () => void;
  onClose: () => void;
}) {
  const trial = selfServeTrialHooks.useTrial();
  const featureName = selfServeTrialFeatures.nameInSentence(featureKey);
  const shortcuts = [
    { label: t('Set up single sign-on'), to: '/platform/sso' },
    { label: t('Review audit logs'), to: '/platform/audit-log' },
    { label: t('Connect a secret manager'), to: '/platform/secret-managers' },
  ];
  return (
    <DialogFrame
      title={t('Your Enterprise plan trial is on')}
      description={
        isNil(endsAt)
          ? t('Every Enterprise plan feature is unlocked for your platform.')
          : t('Every Enterprise plan feature is unlocked until {date}.', {
              date: dayjs(endsAt).format('MMM D'),
            })
      }
      note={
        resumeState !== 'idle' && (
          <ResumeStatus
            state={resumeState}
            featureName={featureName}
            onRetry={onRetry}
          />
        )
      }
      mainTitle={t('Your trial')}
      main={
        <TrialTimeline
          basePlanName={trial.basePlanName}
          started={true}
          startedAt={isNil(startedAt) ? undefined : new Date(startedAt)}
          endsAt={isNil(endsAt) ? undefined : new Date(endsAt)}
        />
      }
      asideTitle={t('Good first steps')}
      aside={
        <div className="flex flex-col divide-y border-y">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm text-gray-12 transition-colors duration-150 hover:text-accent-11"
            >
              {shortcut.label}
              <ArrowRight className="size-4 text-gray-11" />
            </Link>
          ))}
        </div>
      }
      actions={
        <Button size="lg" onClick={onClose}>
          {t('Got it')}
        </Button>
      }
    />
  );
}

function ResumeStatus({
  state,
  featureName,
  onRetry,
}: {
  state: ResumeState;
  featureName: string | null;
  onRetry: () => void;
}) {
  const feature = featureName ?? t('this feature');
  const failed = state === 'failed';
  const saving = state === 'saving';
  return (
    <p
      role="status"
      key={state}
      className={cn(
        failed
          ? 'flex flex-wrap items-center gap-2 text-sm text-danger-11'
          : 'flex items-center gap-2 text-sm text-gray-12',
        enterpriseMotion.swap,
      )}
    >
      {failed ? (
        <CircleAlert className="size-4 shrink-0" />
      ) : saving ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-gray-11 motion-reduce:animate-none" />
      ) : (
        <Check className="size-4 shrink-0 text-success-11" />
      )}
      {failed
        ? t('We could not save your changes to {feature}.', { feature })
        : saving
        ? t('Saving your changes to {feature}…', { feature })
        : t('Your changes to {feature} are saved.', { feature })}
      {failed && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={onRetry}
        >
          {t('Try again')}
        </Button>
      )}
    </p>
  );
}

export function TrialAlreadyUsed() {
  return (
    <DialogFrame
      title={t('Your Enterprise plan trial was already used')}
      description={t(
        'Each platform owner can start the Enterprise plan trial once. Talk to our team to get more time.',
      )}
      actions={
        <SelfServeTrialSalesLink
          surface="enterprise_trial_used"
          variant="default"
        />
      }
    />
  );
}

export function TrialNotStarted({ onClose }: { onClose: () => void }) {
  return (
    <DialogFrame
      title={t('We could not start your trial')}
      description={t(
        'The Enterprise plan trial is not available for your platform right now. Please try again later, or talk to our team.',
      )}
      actions={
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            {t('Close')}
          </Button>
          <SelfServeTrialSalesLink
            surface="enterprise_trial_unavailable"
            variant="default"
          />
        </div>
      }
    />
  );
}

function useMoreBelow(element: HTMLElement | null): boolean {
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    if (isNil(element)) {
      return;
    }
    const update = () =>
      setMoreBelow(
        element.scrollHeight - element.scrollTop - element.clientHeight >
          SCROLL_HINT_SLACK_PX,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [element]);
  return moreBelow;
}

const SCROLL_HINT_SLACK_PX = 8;
