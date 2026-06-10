import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';

export const uploadFile = createAction({
  name: 'uploadFile',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Upload File',
  description: "Upload a media file to AssemblyAI's servers.",
  audience: 'both',
  aiMetadata: {
    description:
      "Uploads a local audio or video file to AssemblyAI and returns an upload URL that can be passed to the Transcribe action. Use this when the media is a file (not already a publicly reachable URL) that AssemblyAI must access. Each call uploads a new copy, so it is not idempotent.",
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Audio File',
      description: 'The File or URL of the audio or video file.',
      required: true,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const uploadedFile = await client.files.upload(
      context.propsValue.file.data
    );
    return uploadedFile;
  },
});
