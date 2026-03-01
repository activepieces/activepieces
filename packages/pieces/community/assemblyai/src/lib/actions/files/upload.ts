import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';

export const uploadFile = createAction({
  name: 'uploadFile',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Upload File',
  description: "Upload a media file to AssemblyAI's servers.",
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
