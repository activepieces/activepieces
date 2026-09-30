import { PieceAuth, Property, AppConnectionType } from '@activepieces/pieces-framework';
import { createClient, ELEVEN_RESIDENCY, ElevenResidency } from './common';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit your Elevenlabs dashboard.
2. Once there, click on your account in the bottom left corner.
3. Press Profile + API Key.
4. Create or copy your API Key. Make sure to enable the following permissions: **user:read**, **text_to_speech**, **voices:read**, and **models**.
`;

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
      const elevenlabs = createClient({
        type: AppConnectionType.CUSTOM_AUTH,
        props: auth,
      });
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
