import { isNil } from '@activepieces/core-utils';
import { PlatformUsage } from '@activepieces/shared';
import { useCallback, useState } from 'react';

import { platformHooks } from '@/hooks/platform-hooks';

import { CreditsWarning } from './chat-types';

const CREDITS_WARNING_THRESHOLD = 70;

export function useCreditsState() {
  const { platform } = platformHooks.useCurrentPlatform();

  const [streamCreditsExhausted, setStreamCreditsExhausted] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const creditsExhausted =
    streamCreditsExhausted ||
    hasExhaustedCredits({
      usage: platform?.usage,
      billingEnforced: platform?.billingEnforced,
    });

  const creditsWarning =
    warningDismissed || creditsExhausted
      ? null
      : computeCreditsWarning(platform?.usage);

  const dismissCreditsWarning = useCallback(() => {
    setWarningDismissed(true);
  }, []);

  return {
    creditsWarning,
    creditsExhausted,
    setCreditsExhausted: setStreamCreditsExhausted,
    warningDismissed,
    dismissCreditsWarning,
  };
}

function hasExhaustedCredits({
  usage,
  billingEnforced,
}: {
  usage: PlatformUsage | undefined;
  billingEnforced: boolean | undefined;
}): boolean {
  if (isNil(usage)) {
    return false;
  }
  const appSumoExhausted =
    !isNil(usage.appSumoAiCreditsRemaining) &&
    usage.appSumoAiCreditsRemaining <= 0;
  const creditsExhausted =
    billingEnforced === true &&
    !isNil(usage.creditsRemaining) &&
    usage.creditsRemaining <= 0;
  return appSumoExhausted || creditsExhausted;
}

function computeCreditsWarning(
  usage: PlatformUsage | undefined,
): CreditsWarning | null {
  if (isNil(usage) || isNil(usage.creditsRemaining)) {
    return null;
  }
  const { creditsUsed, creditsRemaining } = usage;
  const total = creditsUsed + creditsRemaining;
  if (total <= 0) {
    return null;
  }
  const percentage = Math.round((creditsUsed / total) * 100);
  if (percentage < CREDITS_WARNING_THRESHOLD) {
    return null;
  }
  return { percentage };
}
