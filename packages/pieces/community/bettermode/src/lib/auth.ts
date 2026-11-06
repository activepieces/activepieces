import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  BETTERMODE_REGIONS,
  BettermodeApiError,
  BettermodeLoginError,
  isLoginLockout,
  loginWithPassword,
  normalizeDomain,
} from './common/client';

export const bettermodeAuth = PieceAuth.CustomAuth({
  displayName: 'Bettermode',
  description: `Connect with the email and password of a Bettermode member.

1. Pick the region your community is hosted in (EU communities use api.bettermode.de).
2. Enter the community domain, for example community.example.com (https:// is optional).
3. Use the email and password of the member the flows should act as. Admin actions (badges, suspending or deleting members, moderation) need an admin account.`,
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The region of your Bettermode account',
      required: true,
      options: {
        options: BETTERMODE_REGIONS,
      },
    }),
    domain: Property.ShortText({
      displayName: 'BetterMode Domain',
      description: 'The domain of your community, for example community.example.com',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for your Bettermode account',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Password for your Bettermode account',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      normalizeDomain(auth.domain);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid community domain.' };
    }
    if (!EMAIL_PATTERN.test(auth.email.trim())) {
      return { valid: false, error: 'Enter a valid email address.' };
    }
    try {
      await loginWithPassword(auth);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: describeValidationError(error) };
    }
  },
  required: true,
});

function describeValidationError(error: unknown): string {
  if (error instanceof BettermodeLoginError) {
    if (error.apiError.status === 401 || error.apiError.status === 403) {
      return 'Invalid credentials: Bettermode rejected the login. Check the email and password.';
    }
    if (error.stage === 'domain' && error.apiError.status === 200) {
      return `Community domain not found in the selected region. Check the domain and region. (${error.apiError.message})`;
    }
    if (error.stage === 'login' && isLoginLockout(error.apiError)) {
      return 'Bettermode has temporarily blocked logins for this account after too many attempts. Wait 5 minutes and try again.';
    }
    if (error.stage === 'login' && error.apiError.status === 200) {
      return `Invalid credentials: email or password incorrect. (${error.apiError.message})`;
    }
    return `Could not reach Bettermode: ${error.apiError.message}`;
  }
  if (error instanceof BettermodeApiError) {
    return `Could not reach Bettermode: ${error.message}`;
  }
  return `Could not reach Bettermode: ${error instanceof Error ? error.message : 'unknown error'}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
