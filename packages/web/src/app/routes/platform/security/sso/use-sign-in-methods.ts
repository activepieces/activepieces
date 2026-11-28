import {
  ApEdition,
  ApFlagId,
  PlatformWithoutSensitiveData,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { emailDomainQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

export function useSignInMethods(
  platform: PlatformWithoutSensitiveData,
): SignInMethods {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: providers } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );
  const selfHosted = edition === ApEdition.ENTERPRISE;
  const cloud = edition === ApEdition.CLOUD;
  const verifiedDomains = emailDomainQueries.useVerifiedDomains();
  const domainVerified = verifiedDomains.length > 0;
  const working: Record<SignInMethod, boolean> = {
    email: platform.emailAuthEnabled,
    google: Boolean(providers?.google),
    saml:
      !!platform.federatedAuthProviders?.saml && (selfHosted || domainVerified),
  };
  return {
    selfHosted,
    cloud,
    locked: cloud && !domainVerified,
    verifiedDomains,
    working,
    isOnlyWorkingMethod: (method) =>
      working[method] && Object.values(working).filter(Boolean).length === 1,
  };
}

export type SignInMethod = 'email' | 'google' | 'saml';

type SignInMethods = {
  selfHosted: boolean;
  cloud: boolean;
  locked: boolean;
  verifiedDomains: string[];
  working: Record<SignInMethod, boolean>;
  isOnlyWorkingMethod: (method: SignInMethod) => boolean;
};
