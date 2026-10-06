import { PieceAuth, Property, AppConnectionType } from '@activepieces/pieces-framework';
import { createClient, ELEVEN_RESIDENCY, ElevenResidency } from './common';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit your Elevenlabs dashboard.
2. Once there, click on your account in the bottom left corner.
3. Press Profile + API Key.
4. Create or copy your API Key. Enable the permissions for every area you plan to use: user, text to speech, speech to speech, voices, models, history, dubbing, Audio Native, pronunciation dictionaries, and Conversational AI (agents, tests, conversations, knowledge base, tools and secrets). An action whose area is not enabled on the key returns a permission error from ElevenLabs.
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
