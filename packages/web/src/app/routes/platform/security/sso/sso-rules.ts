import {
  ApEdition,
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { flagsApi, FlagsMap } from '@/api/flags-api';
import { platformApi } from '@/api/platforms-api';
import { mutationFeedback } from '@/lib/mutation-feedback';

function signInMethods({
  platform,
  flags,
}: {
  platform: PlatformWithoutSensitiveData;
  flags: FlagsMap;
}): SignInMethods {
  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const domainVerified =
    !!platform.ssoDomain &&
    platform.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.VERIFIED;
  return {
    email: platform.emailAuthEnabled,
    google: platform.googleAuthEnabled && googleOffered(flags),
    saml: samlConnected && (!samlNeedsVerifiedDomain(flags) || domainVerified),
  };
}

function samlNeedsVerifiedDomain(flags: FlagsMap): boolean {
  return flags[ApFlagId.EDITION] === ApEdition.CLOUD;
}

function googleOffered(flags: FlagsMap): boolean {
  const providers = flags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP];
  return (
    typeof providers === 'object' &&
    providers !== null &&
    'google' in providers &&
    providers.google === true
  );
}

function countOf(methods: SignInMethods): number {
  return [methods.email, methods.google, methods.saml].filter(Boolean).length;
}

async function assertSignInRemains(change: SignInChange): Promise<void> {
  const [platform, flags] = await Promise.all([
    platformApi.getCurrentPlatform(),
    flagsApi.getAll(),
  ]);
  const before = signInMethods({ platform, flags });
  const after: SignInMethods = {
    email: change.emailAuthEnabled ?? before.email,
    google: change.googleAuthEnabled === false ? false : before.google,
    saml:
      change.samlConnected === false ||
      (change.domainChanges === true && samlNeedsVerifiedDomain(flags))
        ? false
        : before.saml,
  };
  if (countOf(before) > 0 && countOf(after) === 0) {
    throw mutationFeedback.userError(
      t(
        'This would leave no way to sign in. Turn on another sign-in method first.',
      ),
    );
  }
}

async function change<T>({
  check,
  write,
}: {
  check: SignInChange;
  write: () => Promise<T>;
}): Promise<T> {
  const run = signInChanges.then(async () => {
    await assertSignInRemains(check);
    return write();
  });
  signInChanges = run.catch(() => undefined);
  return run;
}

let signInChanges: Promise<unknown> = Promise.resolve();

export const ssoRules = {
  assertSignInRemains,
  change,
  signInMethods,
  samlNeedsVerifiedDomain,
};

export type SignInMethods = {
  email: boolean;
  google: boolean;
  saml: boolean;
};

type SignInChange = {
  emailAuthEnabled?: boolean;
  googleAuthEnabled?: boolean;
  samlConnected?: boolean;
  domainChanges?: boolean;
};
