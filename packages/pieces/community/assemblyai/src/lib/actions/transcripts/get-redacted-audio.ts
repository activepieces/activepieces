import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getRedactedAudio = createAction({
  name: 'getRedactedAudio',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Redacted Audio',
  description: 'Get the result of the redacted audio model.',
  props: {
    id: transcriptIdProp,
    download_file: Property.Checkbox({
      displayName: 'Download file?',
      required: true,
      defaultValue: false,
    }),
    download_file_name: Property.ShortText({
      displayName: 'Download File Name',
      description:
        'The desired file name for storing in ActivePieces. Make sure the file extension is correct.',
      required: true,
      defaultValue: 'redacted-audio.mp3',
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const redactedAudioResponse = await client.transcripts.redactedAudio(
      context.propsValue.id
    );
    if (redactedAudioResponse.status !== 'redacted_audio_ready') {
      return redactedAudioResponse;
    }
    if (context.propsValue.download_file) {
      const file = await client.transcripts.redactedAudioFile(
        context.propsValue.id
      );
      const fileReference = await context.files.write({
        fileName: context.propsValue.download_file_name,
        data: Buffer.from(await file.arrayBuffer()),
      });
      return {
        ...redactedAudioResponse,
        file: fileReference,
      };
    }
    return redactedAudioResponse;
  },
});
