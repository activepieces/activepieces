import {
  createCustomApiCallAction,
  HttpError,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType, PieceCategory } from '@activepieces/pieces-framework';
import { kimaiCreateTimesheetAction } from './lib/actions/create-timesheet';
import { makeClient } from './lib/common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const kimaiAuth = PieceAuth.CustomAuth({
  description: `
  To configure API access:

  1. Go to Kimai Web UI;
  2. Click on your user profile and then go to "API Access";
  3. Generate an API token.
  `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Kimai Instance URL (e.g. https://demo.kimai.org)',
      required: true,
    }),
    api_token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Kimai API Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      await propsValidation.validateZod(auth, {
        base_url: z.string().check(z.url()),
      });
    }

    if (!auth) {
      return {
        valid: false,
        error: 'Configuration missing!',
      };
    }

    const client = await makeClient({
      type: AppConnectionType.CUSTOM_AUTH,
      props: auth,
    });

    try {
      const pingResponse = await client.ping();
      if (pingResponse.message !== 'pong') {
        return {
          valid: false,
          error: pingResponse.message,
        };
      }

      return {
        valid: true,
      };
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.response.body instanceof Object && 'message' in e.response.body) {
          return {
            valid: false,
            error: e.response.body.message as string,
          };
        }
      }

      return {
        valid: false,
        error: 'Please check your server URL/credentials and try again.',
      };
    }
  },
  required: true,
});

export const kimai = createPiece({
  displayName: 'Kimai',
  description: 'Open-source time tracking software',

  auth: kimaiAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/kimai.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["facferreira","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    kimaiCreateTimesheetAction,
    createCustomApiCallAction({
     baseUrl: (auth) => (auth?.props.base_url ?? ''),
      auth: kimaiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_token}`,
      }),
    }),
  ],
  triggers: [],
});
