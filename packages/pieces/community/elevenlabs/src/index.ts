import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { textToSpeech } from './lib/actions/text-to-speech-action';
import {
  createClient,
  ELEVEN_RESIDENCY,
  ElevenAuthType,
  ElevenResidency,
  getApiKey,
  getRegionApiUrl
} from './lib/common';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit your Elevenlabs dashboard.
2. Once there, click on your account in the bottom left corner.
3. Press Profile + API Key.
4. Copy the API Key.
`;

const customApiCallDescription = `
Check [Elevenlabs API reference](https://elevenlabs.io/docs/api-reference/introduction)
for the list of available endpoints.
`

export const elevenlabsAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    region: Property.StaticDropdown<ElevenResidency>({
      displayName: 'Region',
      description: 'Use according URL in Custom API Call pieces',
      required: true,
      options: {
        placeholder: 'Please select your account region...',
        options: [
          { label: `default - ${ELEVEN_RESIDENCY['default'].base}`, value: 'default' },
          { label: `US - ${ELEVEN_RESIDENCY['us'].base}`, value: 'us' },
          { label: `EU - ${ELEVEN_RESIDENCY['eu'].base}`, value: 'eu' },
        ],
      },
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const elevenlabs = createClient(auth);
      await elevenlabs.user.get();

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key or Region.',
      };
    }
  },
});

export const elevenlabs = createPiece({
  displayName: 'ElevenLabs',
  auth: elevenlabsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/elevenlabs.png',
  authors: ['pfernandez98'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'AI Voice Generator & Text to Speech',
  actions: [
    textToSpeech,
    createCustomApiCallAction({
      // it would be more useful to have hint for URL
      description: customApiCallDescription,
      // missing propsValue to not override url when credentials are changed
      // @see packages/pieces/community/common/src/lib/helpers/index.ts:65
      baseUrl: (auth) => {
        return getRegionApiUrl((auth as ElevenAuthType)?.region)
      },
      auth: elevenlabsAuth,
      authMapping: async (auth) => {
        return ({
          // keep old plain value for bc
          'xi-api-key': `${getApiKey(auth as ElevenAuthType)}`,
        })
      },
    }),
  ],
  triggers: [],
});
