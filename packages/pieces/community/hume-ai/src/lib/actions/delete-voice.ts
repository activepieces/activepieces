import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const deleteVoice = createAction({
  name: 'delete_voice',
  displayName: 'Delete Voice',
  description: 'Delete a custom voice from your account',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently remove a saved custom voice from your Hume AI account, identified by its voice name. Use to clean up voices that are no longer needed. Deletion is keyed on the name and converges to the same end state, so re-running with the same name is idempotent.',
    idempotent: true,
  },
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
