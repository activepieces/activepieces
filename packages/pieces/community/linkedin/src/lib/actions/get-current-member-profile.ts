import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { buildLinkedinError, linkedinCommon } from '../common';
import { linkedinAuth } from '../..';
import { getCurrentMemberProfileActionOutputSchema } from '../output-schemas';

const readLocale = (locale: unknown): string | null => {
  if (typeof locale === 'string') {
    return locale;
  }
  if (typeof locale === 'object' && locale !== null) {
    const language = Reflect.get(locale, 'language');
    const country = Reflect.get(locale, 'country');
    if (typeof language === 'string' && typeof country === 'string') {
      return `${language}_${country}`;
    }
    if (typeof language === 'string') {
      return language;
    }
  }
  return null;
};

export const getCurrentMemberProfile = createAction({
  auth: linkedinAuth,
  name: 'get_current_member_profile',
  classification: 'READ',
  displayName: 'Get Current Member Profile',
  description: 'Get the profile of the LinkedIn member who owns the connection',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the OpenID profile of the LinkedIn member that authorized the connection, including the member URN needed as the author of a post or an image upload. Call this first whenever another action asks for an author URN. Safe to retry; it never changes anything.',
    idempotent: true,
  },
  props: {},
  outputSchema: getCurrentMemberProfileActionOutputSchema,

  run: async (context) => {
    try {
      const response = await httpClient.sendRequest<UserInfoResponse>({
        method: HttpMethod.GET,
        url: `${linkedinCommon.baseUrl}/v2/userinfo`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      const profile = response.body;
      return {
        sub: profile.sub ?? null,
        member_urn: profile.sub ? `urn:li:person:${profile.sub}` : null,
        name: profile.name ?? null,
        given_name: profile.given_name ?? null,
        family_name: profile.family_name ?? null,
        email: profile.email ?? null,
        email_verified: profile.email_verified ?? null,
        picture: profile.picture ?? null,
        locale: readLocale(profile.locale),
      };
    } catch (error) {
      throw buildLinkedinError({
        error,
        resource: 'the authenticated member profile',
      });
    }
  },
});

interface UserInfoResponse {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  locale?: unknown;
}
