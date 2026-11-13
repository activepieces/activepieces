import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { pocketbaseClient } from './common/client';
import type { PocketbaseAuthValue } from './common/types';

const markdown = '\nProvide your PocketBase **host URL** and **superuser credentials**.\n\nFind your admin panel at `https://your-host/_/`.\n';

export const pocketbaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'Your Pocketbase host URL (e.g., https://pocketbase.your-project.com)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Superuser Email',
      description: 'The email address of your Pocketbase superuser',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Superuser Password',
      description: 'The password of your Pocketbase superuser',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const connection: PocketbaseAuthValue = { type: AppConnectionType.CUSTOM_AUTH, props: auth };
      const host = pocketbaseClient.baseUrl({ auth: connection });

      try {
        const parsedUrl = new URL(host);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return {
            valid: false,
            error: 'Host URL must use HTTP or HTTPS protocol',
          };
        }
      } catch {
        return {
          valid: false,
          error: 'Please enter a valid URL',
        };
      }

      const { data, error: requestError } = await tryCatch(() => pocketbaseClient.authenticate({ auth: connection }));

      if (requestError) {
        const status = requestError instanceof HttpError ? requestError.response.status : undefined;
        if (status === 400 || status === 401 || status === 403) {
          return {
            valid: false,
            error: 'Invalid superuser email or password.',
          };
        }
        return {
          valid: false,
          error: `Could not connect to PocketBase: ${requestError instanceof Error ? requestError.message : 'Unknown error'}. Please check your host URL.`,
        };
      }

      if (data?.token) {
        return { valid: true };
      }

      return {
        valid: false,
        error: 'Authentication failed. Please check your superuser email and password.',
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to connect to PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your credentials.`,
      };
    }
  },
});
