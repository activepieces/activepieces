import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const vercelAuth = PieceAuth.CustomAuth({
  description:
    'Authenticate with a Vercel personal access token. Optionally provide a team ID or team slug to operate on team-owned resources.',
  required: true,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Vercel Access Token',
      description: 'Create a token in Vercel Settings → Tokens.',
      required: true,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'Optional. Use this to target a specific Vercel team.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Team Slug',
      description: 'Optional. Team slug. Ignored when Team ID is provided.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const queryParams: Record<string, string> = {
        limit: '1',
      };

      if (auth.teamId) {
        queryParams['teamId'] = auth.teamId;
      } else if (auth.slug) {
        queryParams['slug'] = auth.slug;
      }

      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.vercel.com/v10/projects',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.token,
        },
        queryParams,
      });

      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error).message,
      };
    }
  },
});

export type VercelAuthValue = AppConnectionValueForAuthProperty<typeof vercelAuth>;
