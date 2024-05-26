import { Platform } from '@activepieces/shared';

export const AtLeastOneLoginMethodMsg = $localize`At least one login method must be enabled`;
export function doesPlatformHaveAtLeastOneLoginMethodEnabled(
  platform: Platform
) {
  const email = platform.emailAuthEnabled;
  return Object.keys(platform.federatedAuthProviders).length > 0 || email;
}
