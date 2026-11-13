import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const createVoice = createAction({
  name: 'create_voice',
  classification: 'WRITE',
  displayName: 'Create Voice',
  description: 'Save the voice from an earlier speech generation for reuse.',
  audience: 'both',
  aiMetadata: {
    description: 'Save a reusable custom voice in your Hume AI account from a prior TTS generation ID, under a chosen name. Use after generating speech you want to persist and reuse in later synthesis calls. Requires a valid generation ID from an earlier Generate Text to Speech result; creates a new voice resource on each call (not idempotent).',
    idempotent: false,
  },
  auth: humeAiAuth,
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'Shown by Generate Text to Speech when it makes 2 or more versions.',
      placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      required: true,
    }),
    voiceName: Property.ShortText({
      displayName: 'Voice Name',
      description: 'Name to save the voice under.',
      placeholder: 'Support line narrator',
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
