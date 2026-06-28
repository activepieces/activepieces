import { AIProviderName, isNil } from '@activepieces/core-utils';
import { useCallback, useState } from 'react';

import { aiProviderQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { CreditsWarning } from './chat-types';

const CREDITS_WARNING_THRESHOLD = 70;

export function useCreditsState() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: providers } = aiProviderQueries.useAiProviders();

  const [creditsExhausted, setCreditsExhausted] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const creditsWarning = warningDismissed
    ? null
    : computeCreditsWarning({ platform: platform ?? {}, providers });

  const dismissCreditsWarning = useCallback(() => {
    setWarningDismissed(true);
  }, []);

  return {
    creditsWarning,
    creditsExhausted,
    setCreditsExhausted,
    warningDismissed,
    dismissCreditsWarning,
  };
}

function computeCreditsWarning({
  platform,
  providers,
}: {
  platform: {
    usage?: { creditsUsed: number; creditsRemaining?: number | null };
  };
  providers?: { provider: string; enabledForChat?: boolean }[];
}): CreditsWarning | null {
  const isActivepieces = providers?.some(
    (p) => p.provider === AIProviderName.ACTIVEPIECES && p.enabledForChat,
  );
  if (
    !isActivepieces ||
    !platform.usage ||
    isNil(platform.usage.creditsRemaining)
  ) {
    return null;
  }
  const { creditsUsed, creditsRemaining } = platform.usage;
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
