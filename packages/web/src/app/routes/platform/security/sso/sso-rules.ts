import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { platformApi } from '@/api/platforms-api';
import { mutationFeedback } from '@/lib/mutation-feedback';

function signInMethodCount(state: SignInState): number {
  const samlSignIn =
    state.samlConnected &&
    state.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.VERIFIED;
  return [state.emailAuthEnabled, state.googleAuthEnabled, samlSignIn].filter(
    Boolean,
  ).length;
}

function stateOf(platform: PlatformWithoutSensitiveData): SignInState {
  return {
    emailAuthEnabled: platform.emailAuthEnabled,
    googleAuthEnabled: platform.googleAuthEnabled,
    samlConnected: !!platform.federatedAuthProviders?.saml,
    ssoDomainVerification: platform.ssoDomainVerification ?? null,
  };
}

async function assertSignInRemains(change: SignInChange): Promise<void> {
  const fresh = stateOf(await platformApi.getCurrentPlatform());
  const after: SignInState = {
    ...fresh,
    ...change,
    ssoDomainVerification: change.domainChanges
      ? null
      : fresh.ssoDomainVerification,
  };
  if (signInMethodCount(fresh) > 0 && signInMethodCount(after) === 0) {
    throw mutationFeedback.userError(
      t(
        'This would leave no way to sign in. Turn on another sign-in method first.',
      ),
    );
  }
}

export const ssoRules = { assertSignInRemains };

type SignInState = {
  emailAuthEnabled: boolean;
  googleAuthEnabled: boolean;
  samlConnected: boolean;
  ssoDomainVerification: PlatformWithoutSensitiveData['ssoDomainVerification'];
};

type SignInChange = Partial<
  Pick<SignInState, 'emailAuthEnabled' | 'googleAuthEnabled' | 'samlConnected'>
> & { domainChanges?: boolean };
