import { createAction, Property } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUploadFileOutputSchema } from '../../../output-schemas';

export const uploadFileAction = createAction({
  auth: podioAuth,
  name: 'podio_upload_file',
  outputSchema: podioUploadFileOutputSchema,
  displayName: 'Upload File',
  description: 'Uploads a file to Podio so it can be attached to an object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file to Podio and returns its file id. The file is not attached to anything yet: pass the id to Attach File, to Replace File, or as a file id when creating an item, task, status or comment. Each call uploads another file.',
    idempotent: false,
  },
  props: {
    file: Property.File({ displayName: 'File', description: 'The file to upload.', required: true }),
    fileName: podioAiProps.text({ required: false, displayName: 'File Name', description: 'The name to store the file under, with its extension. Defaults to the name of the uploaded file.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.upload<unknown>({ auth, path: '/file/', file: propsValue.file, fileName: propsValue.fileName ?? propsValue.file.filename });
  },
});
