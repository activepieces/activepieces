import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CircleAlert, TriangleAlert, X } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { billingQueries } from '../hooks/billing-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { billingUtils, BILLING_DATE_FORMAT } from '../utils/billing-utils';
import { creditsAlertDismissal } from '../utils/credits-alert-dismissal';

import { CreditsActionButton } from './credits-action-button';

const PROJECT_PATH_PREFIX = '/projects/';

export const CreditsUsageAlert = React.memo(() => {
  const {
    platformId,
    usage,
    isPlatformAdmin,
    isPaid,
    isBillingEnforced,
    creditsRemaining,
    isUnlimited,
    percentUsed,
    severity,
  } = useCreditsUsage();
  const location = useLocation();
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [dismissedAt, setDismissedAt] = useState(() =>
    creditsAlertDismissal.read({ platformId }),
  );

  const visible = billingUtils.shouldShowCreditsAlert({
    edition,
    isEmbedded: embedState.isEmbedded,
    isProjectRoute: location.pathname.startsWith(PROJECT_PATH_PREFIX),
    isUnlimited,
    isBillingEnforced,
    severity,
    isDismissalActive: creditsAlertDismissal.isActive({ dismissedAt }),
  });
  const { data: info } = billingQueries.usePlatformSubscription(
    platformId,
    visible && isPlatformAdmin,
  );

  if (!visible || isNil(creditsRemaining)) {
    return null;
  }

  const resetLine = billingUtils.resolveCreditsReset({
    creditsNextResetAt: usage?.creditsNextResetAt,
    creditsResetInterval: info?.creditsResetInterval,
    nextBillingDate: info?.nextBillingDate,
    isPaid,
    dateFormat: BILLING_DATE_FORMAT,
  });
  const isDanger = severity === 'error';
  const Icon = isDanger ? CircleAlert : TriangleAlert;

  const message = [
    creditsRemaining <= 0
      ? t("You've used all of your credits.")
      : t("You've used {percent}% of your credits — {remaining} left.", {
          percent: percentUsed,
          remaining: billingUtils.formatCredits(creditsRemaining),
        }),
    ...(isNil(resetLine) ? [] : [`${resetLine.label} ${resetLine.value}.`]),
    ...(isPlatformAdmin
      ? []
      : [t('Contact a platform admin to get more credits.')]),
  ].join(' ');

  const dismissAlert = () => {
    const timestamp = dayjs().toISOString();
    setDismissedAt(timestamp);
    creditsAlertDismissal.write({ platformId, dismissedAt: timestamp });
  };

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <Alert
        variant={isDanger ? 'destructive' : 'warning'}
        className={cn(
          'flex items-center gap-2 py-2',
          isDanger
            ? 'border-destructive/50 bg-destructive-100/10'
            : 'bg-warning-100/10',
        )}
      >
        <Icon className="size-4 shrink-0" />
        <AlertDescription className="min-w-0 text-current">
          {message}
        </AlertDescription>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          <CreditsActionButton variant="accent" />
          {!isDanger && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Dismiss')}
              className="text-current"
              onClick={dismissAlert}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
});

CreditsUsageAlert.displayName = 'CreditsUsageAlert';
