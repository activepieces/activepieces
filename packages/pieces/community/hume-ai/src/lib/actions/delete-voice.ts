import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const deleteVoice = createAction({
  name: 'delete_voice',
  displayName: 'Delete Voice',
  description: 'Delete a custom voice from your account',
  auth: humeAiAuth,
  props: {
    voiceName: Property.ShortText({
      displayName: 'Voice Name',
      description: 'The name of the custom voice to delete',
      required: true,
    }),
  },
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const { voiceName } = context.propsValue;

    try {
      await client.tts.voices.delete({
        name: voiceName,
      });

      return {
        success: true,
        message: `Voice "${voiceName}" deleted successfully`,
        deletedVoice: voiceName,
      };
    } catch (error) {
      throw new Error(`Voice deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
