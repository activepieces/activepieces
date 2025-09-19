import { propsValidation } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { z } from 'zod';
import { getAccessToken } from './helper';
import { PromptXAuthType, Server } from './types';

export const promptxAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown<Server>({
      displayName: 'Server',
      options: {
        options: [
          {
            label: 'Production',
            value: 'production',
          },
          {
            label: 'Test',
            value: 'staging',
          },
        ],
      },
      required: true,
      defaultValue: 'production',
    }),
    customAuthUrl: Property.ShortText({
      displayName: 'Custom Auth URL',
      description: 'Optional custom URL of the authentication service',
      required: false,
    }),
    customAppUrl: Property.ShortText({
      displayName: 'Custom App URL',
      description: 'Optional custom URL of the application service',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'PromptX username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'PromptX password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await validateAuth(auth);
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
});

const validateAuth = async (auth: PromptXAuthType) => {
  await propsValidation.validateZod(auth, {
    server: z.union([z.literal('production'), z.literal('staging')]),
    customAuthUrl: z.optional(z.string()),
    customAppUrl: z.optional(z.string()),
    username: z.string(),
    password: z.string(),
  });

  const accessToken = await getAccessToken(auth);

  if (isNil(accessToken)) {
    throw new Error(
      'Authentication failed. Please check your credentials and try again.'
    );
  }

  console.log('[promptx-agent] authenticated');
};
