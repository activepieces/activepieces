import {
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

export function useGoogleSignInAvailable(): boolean {
  const { data } = flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
  );
  return Boolean(data?.google);
}
