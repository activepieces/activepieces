import {
  PieceAuth,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { saveContent } from './api';

export type TotalCMSAuthType = { license: string; domain: string };

export const cmsAuth = PieceAuth.CustomAuth({
  description: 'Setup your Total CMS connection',
  props: {
    domain: Property.ShortText({
      displayName: 'Total CMS Domain',
      description: 'The domain of your Total CMS website',
      required: true,
      validators: [Validators.url],
    }),
    license: PieceAuth.SecretText({
      displayName: 'License Key',
      description: 'The License key for your Total CMS domain',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await validateAuth(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});

const validateAuth = async (auth: TotalCMSAuthType) => {
  const response = await saveContent(auth, 'text', 'activepieces', {
    text: 'verified',
  });
  if (response.success !== true) {
    throw new Error(
      'Authentication failed. Please check your domain and license key and try again.'
    );
  }
};
