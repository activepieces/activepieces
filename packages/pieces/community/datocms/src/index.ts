import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpHeaders,
} from '@activepieces/pieces-common';

export const DATO_BASE_URL = 'https://site-api.datocms.com';

export const datoAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
    environment: Property.ShortText({
      displayName: 'Environment',
      description: 'Optional sandbox environment',
      required: false,
    }),
  },
});

type DatoAuthType = {
  apiKey: string;
  environment?: string;
};

export const datocms = createPiece({
  displayName: 'Dato CMS',
  description: 'Dato is a modern headless CMS',
  auth: datoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/datocms.png',
  authors: ['AdamSelene'],
  actions: [
    createCustomApiCallAction({
      auth: datoAuth,
      baseUrl: () => DATO_BASE_URL,
      authMapping: async (auth) => {
        const { apiKey, environment } = auth as DatoAuthType;
        const headers: HttpHeaders = {
          Accept: 'application/json',
          'Content-Type': 'application/vnd.api+json',
          'X-Api-Version': '3',
          Authorization: `Bearer ${apiKey}`,
        };
        if (environment) {
          headers['X-Environment'] = environment;
        }
        return headers;
      },
    }),
  ],
  triggers: [],
});
