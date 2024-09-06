import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../..';
import { getAssemblyAIClient } from '../client';

export const upload = createAction({
  name: 'upload',
  auth: assemblyaiAuth,
  displayName: 'Upload File',
  description: 'Upload a media file to AssemblyAI\'s servers.',
  props: {
    file: Property.File({
      displayName: 'Audio File',
      description: 'The File or URL of the audio or video file.',
      required: true,
    })
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const uploadedFile = await client.files.upload(context.propsValue.file.data);
    return uploadedFile;
  },
});
