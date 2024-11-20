import {
  createCustomApiCallAction,
  HttpError,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { kimaiCreateTimesheetAction } from './lib/actions/create-timesheet';
import { makeClient } from './lib/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const kimaiAuth = PieceAuth.CustomAuth({
  description: `
  To configure API access:

  1. Go to Kimai Web UI;
  2. Click on your user profile and then go to "API Access";
  3. Configure an API password (different from user password).
  `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Kimai Instance URL (e.g. https://demo.kimai.org)',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'Username',
      description: 'Kimai Username/Email',
      required: true,
    }),
    api_password: PieceAuth.SecretText({
      displayName: 'API Password',
      description: 'Kimai API Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      await propsValidation.validateZod(auth, {
        base_url: z.string().url(),
      });
    }

    if (!auth) {
      return {
        valid: false,
        error: 'Configuration missing!',
      };
    }

    const client = await makeClient(auth);

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
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: kimaiAuth,
      authMapping: async (auth) => ({
        'X-AUTH-USER': (auth as { user: string }).user,
        'X-AUTH-TOKEN': (auth as { api_password: string }).api_password,
      }),
    }),
  ],
  triggers: [],
});
