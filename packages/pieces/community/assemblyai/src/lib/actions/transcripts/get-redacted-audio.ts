import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getRedactedAudio = createAction({
  name: 'getRedactedAudio',
  classification: 'READ',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Redacted Audio',
  description:
    'Get the bleeped audio of a transcript with redacted audio on.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the PII-redacted audio result for an existing transcript by its ID; if redaction is ready it returns the redacted audio URL and can optionally download the file into Activepieces storage. Use this only for transcripts created with PII audio redaction enabled. Requires a valid transcript ID; read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'audio',
      display: 'section',
      label: 'Redacted Audio',
      icon: 'file',
      props: ['id', 'download_file'],
    },
  ],
  props: {
    id: transcriptIdProp,
    download_file: Property.Checkbox({
      displayName: 'Save Audio File',
      description: 'Save a copy of the bleeped audio to the flow.',
      required: true,
      defaultValue: false,
      reveals: ['download_file_name'],
    }),
    download_file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Include the file extension.',
      required: false,
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
        fileName: context.propsValue.download_file_name || 'redacted-audio.mp3',
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
