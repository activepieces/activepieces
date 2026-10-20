import {
  ApEdition,
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

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
  const domainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const working: Record<SignInMethod, boolean> = {
    email: platform.emailAuthEnabled,
    google: Boolean(providers?.google),
    saml:
      !!platform.federatedAuthProviders?.saml && (selfHosted || domainVerified),
  };
  return {
    selfHosted,
    working,
    isOnlyWorkingMethod: (method) =>
      working[method] && Object.values(working).filter(Boolean).length === 1,
  };
}

export type SignInMethod = 'email' | 'google' | 'saml';

type SignInMethods = {
  selfHosted: boolean;
  working: Record<SignInMethod, boolean>;
  isOnlyWorkingMethod: (method: SignInMethod) => boolean;
};
