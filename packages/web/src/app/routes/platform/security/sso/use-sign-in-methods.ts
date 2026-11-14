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
  const cloud = edition === ApEdition.CLOUD;
  const verifiedDomain =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED
      ? platform.ssoDomain ?? null
      : null;
  const domainVerified = verifiedDomain !== null;
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
    verifiedDomain,
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
  verifiedDomain: string | null;
  working: Record<SignInMethod, boolean>;
  isOnlyWorkingMethod: (method: SignInMethod) => boolean;
};
