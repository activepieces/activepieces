import {
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export const useSignInMethods = (): SignInMethods => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );

  const email = platform.emailAuthEnabled;
  const google = Boolean(thirdPartyAuthProviders?.google);
  const saml = !!platform.federatedAuthProviders?.saml;
  const enabledCount = [email, google, saml].filter(Boolean).length;

  return {
    email,
    google,
    saml,
    googleEnabledButNotConfigured: platform.googleAuthEnabled && !google,
    isLastMethod: (method) =>
      enabledCount === 1 && { email, google, saml }[method],
  };
};

export type SignInMethod = 'email' | 'google' | 'saml';

export type SignInMethods = {
  email: boolean;
  google: boolean;
  saml: boolean;
  googleEnabledButNotConfigured: boolean;
  isLastMethod: (method: SignInMethod) => boolean;
};
