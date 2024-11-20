import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { saveContent } from './api';

export type TotalCMSAuthType = { license: string; domain: string };

export const cmsAuth = PieceAuth.CustomAuth({
  description: 'Setup your Total CMS connection',
  props: {
    domain: Property.ShortText({
      displayName: 'Total CMS Domain',
      description: 'The domain of your Total CMS website',
      required: true,
    }),
    license: PieceAuth.SecretText({
      displayName: 'License Key',
      description: 'The License key for your Total CMS domain',
      required: true,
    }),
  },
  required: true,
  async validate({ auth }) {
    await propsValidation.validateZod(auth, {
      domain: z.string().url(),
      license: z.string(),
    });

    const response = await saveContent(auth, 'text', 'activepieces', {
      text: 'verified',
    });
    if (response.success !== true) {
      throw new Error(
        'Authentication failed. Please check your domain and license key and try again.'
      );
    }
    return {
      valid: true,
    };
  },
});
