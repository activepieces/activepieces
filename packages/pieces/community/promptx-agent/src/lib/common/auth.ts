import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { getAccessToken } from './helper';
import { PromptXAuthType } from './types';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const promptxAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown({
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
      await validateAuth(auth as PromptXAuthType);
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
    username: z.string(),
    password: z.string(),
  });

  const accessToken = await getAccessToken(auth);

  if (isNil(accessToken)) {
    throw new Error(
      'Authentication failed. Please check your credentials and try again.'
    );
  }

  console.log('[promptx-agent] validated authentication');
};
