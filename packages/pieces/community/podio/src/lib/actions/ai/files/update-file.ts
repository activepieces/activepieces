import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateFileAction = createAction({
  auth: podioAuth,
  name: 'podio_update_file',
  displayName: 'Update File',
  description: 'Changes the description of a file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the description of a Podio file; the description is the only thing this can change. The file id comes from Upload File, Get Files, Get Files On App or Get Files On Space.',
    idempotent: true,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the file, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
    description: podioAiProps.longText({ required: true, displayName: 'Description', description: 'The new description of the file.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/file/${propsValue.fileId}`,
      body: { description: propsValue.description },
    });
  },
});
