import {
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

function signInMethodCount({
  state,
  googleConfigured,
}: {
  state: SignInState;
  googleConfigured: boolean;
}): number {
  const googleSignIn = state.googleAuthEnabled && googleConfigured;
  const samlSignIn =
    state.samlConnected &&
    state.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.VERIFIED;
  return [state.emailAuthEnabled, googleSignIn, samlSignIn].filter(Boolean)
    .length;
}

function stateOf(platform: PlatformWithoutSensitiveData): SignInState {
  return {
    emailAuthEnabled: platform.emailAuthEnabled,
    googleAuthEnabled: platform.googleAuthEnabled,
    samlConnected: !!platform.federatedAuthProviders?.saml,
    ssoDomainVerification: platform.ssoDomainVerification ?? null,
  };
}

function useGoogleConfigured(): boolean {
  const { data } = flagsHooks.useFlag<boolean>(ApFlagId.GOOGLE_AUTH_CONFIGURED);
  return data === true;
}

async function assertSignInRemains({
  change,
  googleConfigured,
}: {
  change: SignInChange;
  googleConfigured: boolean;
}): Promise<void> {
  const fresh = stateOf(await platformApi.getCurrentPlatform());
  const after: SignInState = {
    ...fresh,
    ...change,
    ssoDomainVerification: change.domainChanges
      ? null
      : fresh.ssoDomainVerification,
  };
  if (
    signInMethodCount({ state: fresh, googleConfigured }) > 0 &&
    signInMethodCount({ state: after, googleConfigured }) === 0
  ) {
    throw mutationFeedback.userError(
      t(
        'This would leave no way to sign in. Turn on another sign-in method first.',
      ),
    );
  }
}

export const ssoRules = { assertSignInRemains, useGoogleConfigured };

type SignInState = {
  emailAuthEnabled: boolean;
  googleAuthEnabled: boolean;
  samlConnected: boolean;
  ssoDomainVerification: PlatformWithoutSensitiveData['ssoDomainVerification'];
};

type SignInChange = Partial<
  Pick<SignInState, 'emailAuthEnabled' | 'googleAuthEnabled' | 'samlConnected'>
> & { domainChanges?: boolean };
