import { Platform } from '@activepieces/shared';

export const AtLeastOneLoginMethodMsg = $localize`At least one login method must be enabled`;
export function doesPlatformHaveAtLeastOneLoginMethodEnabled(
  platform: Platform
) {
  const google = platform.federatedAuthProviders.google;
  const github = platform.federatedAuthProviders.github;
  const email = platform.emailAuthEnabled;
  return google !== undefined || github !== undefined || email;
}
