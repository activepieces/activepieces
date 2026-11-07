import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { translateText } from './lib/actions/translate-text';

const markdownDescription = `
To get your DeepL API key:

1. Log in to your DeepL account.
2. Open **API Keys** at https://www.deepl.com/your-account/keys
3. Copy a key and paste it below.

Free plan keys end in \`:fx\`.
`;
export const deeplAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    key: Property.ShortText({
      displayName: 'API Key',
      description: 'Found under API Keys in your DeepL account.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Plan',
      description: 'The plan your key belongs to; Free keys end in :fx.',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Free',
            value: 'free',
            description: 'api-free.deepl.com',
          },
          {
            label: 'Pro',
            value: 'paid',
            description: 'api.deepl.com',
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
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/deepl.png',
  categories: [],
  authors: ["BBND","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    translateText,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth?.props.type === 'free'
          ? 'https://api-free.deepl.com/v2'
          : 'https://api.deepl.com/v2',
      auth: deeplAuth,
      authMapping: async (auth) => ({
        Authorization: `DeepL-Auth-Key ${auth.props.key}`,
      }),
      props: {
        url: {
          description:
            "Full URL, or a path relative to your plan's DeepL API address.",
          placeholder: '/usage',
        },
      },
    }),
  ],
  triggers: [],
});
