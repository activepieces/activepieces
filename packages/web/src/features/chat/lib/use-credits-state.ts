import { AIProviderName } from '@activepieces/core-utils';
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
    : computeCreditsWarning({ platform, providers });

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
    usage?: { totalAiCreditsUsed: number; aiCreditsLimit: number };
  };
  providers?: { provider: string; enabledForChat?: boolean }[];
}): CreditsWarning | null {
  const isActivepieces = providers?.some(
    (p) => p.provider === AIProviderName.ACTIVEPIECES && p.enabledForChat,
  );
  if (
    !isActivepieces ||
    !platform.usage ||
    platform.usage.aiCreditsLimit <= 0
  ) {
    return null;
  }
  const { totalAiCreditsUsed, aiCreditsLimit } = platform.usage;
  const percentage = Math.round((totalAiCreditsUsed / aiCreditsLimit) * 100);
  if (percentage < CREDITS_WARNING_THRESHOLD) {
    return null;
  }
  return { percentage };
}
