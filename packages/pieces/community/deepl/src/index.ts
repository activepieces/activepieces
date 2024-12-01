import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { translateText } from './lib/actions/translate-text';

const markdownDescription = `
Follow these instructions to get your DeepL API Key:

1. Log in to your DeepL account.
2. Visit https://www.deepl.com/account/summary
3. Go to the API section and obtain your DeepL API Key.
`;
export const deeplAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    key: Property.ShortText({
      displayName: 'Api key',
      description: 'Enter the api key',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Api url',
      description: 'Select api url',
      required: true,
      options: {
        options: [
          {
            label: 'Free API',
            value: 'free',
          },
          {
            label: 'Paid API',
            value: 'paid',
          },
        ],
      },
    }),
  },
  required: true,
});

export const deepl = createPiece({
  displayName: 'DeepL',
  description: 'AI-powered language translation',
  auth: deeplAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/deepl.png',
  categories: [],
  authors: ["BBND","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    translateText,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        (auth as { type: string }).type === 'free'
          ? 'https://api-free.deepl.com/v2'
          : 'https://api.deepl.com/v2', // Replace with the actual base URL
      auth: deeplAuth,
      authMapping: async (auth) => ({
        Authorization: `DeepL-Auth-Key ${(auth as { key: string }).key}`,
      }),
    }),
  ],
  triggers: [],
});
