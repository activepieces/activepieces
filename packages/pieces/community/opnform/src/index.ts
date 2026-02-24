import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { opnformNewSubmission } from './lib/triggers/new-submission';
import { API_URL_DEFAULT, opnformCommon } from './lib/common';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const opnformAuth = PieceAuth.CustomAuth({
  description:
    'Please use your Opnform API Key. [Click here for create API Key](https://opnform.com/home?user-settings=access-tokens)',
  required: true,
  props: {
    baseApiUrl: Property.ShortText({
      displayName: `Base URL (Default: ${API_URL_DEFAULT})`,
      required: false,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async (
    auth
  ): Promise<{ valid: true } | { valid: false; error: string }> => {
    try {
      const isValid = await opnformCommon.validateAuth(auth.auth);
      if (isValid) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API Key' };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});

export const opnform = createPiece({
  displayName: 'Opnform',
  description:
    'Create beautiful online forms and surveys with unlimited fields and submissions',

  auth: opnformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opnform.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['JhumanJ', 'chiragchhatrala'],
  actions: [
    createCustomApiCallAction({
      auth: opnformAuth,
      baseUrl: (auth) => {
        return opnformCommon.getBaseUrl(auth);
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.props.apiKey}`,
        };
      },
    }),
  ],
  triggers: [opnformNewSubmission],
});
