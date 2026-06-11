import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const createVoice = createAction({
  name: 'create_voice',
  displayName: 'Create Voice',
  description: 'Save a custom voice to your account using a TTS generation ID',
  audience: 'both',
  aiMetadata: {
    description: 'Save a reusable custom voice in your Hume AI account from a prior TTS generation ID, under a chosen name. Use after generating speech you want to persist and reuse in later synthesis calls. Requires a valid generation ID from an earlier Generate Text to Speech result; creates a new voice resource on each call (not idempotent).',
    idempotent: false,
  },
  auth: humeAiAuth,
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The unique ID from a previous TTS generation to save as a custom voice',
      required: true,
    }),
    voiceName: Property.ShortText({
      displayName: 'Voice Name',
      description: 'A descriptive name for your custom voice',
      required: true,
    }),
  },
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const { generationId, voiceName } = context.propsValue;

    try {
      const response = await client.tts.voices.create({
        generationId,
        name: voiceName,
      });

      return {
        id: response.id,
        name: response.name,
        provider: response.provider,
        compatibleOctaveModels: response.compatibleOctaveModels,
        generationId: generationId,
      };
    } catch (error) {
      throw new Error(`Voice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
