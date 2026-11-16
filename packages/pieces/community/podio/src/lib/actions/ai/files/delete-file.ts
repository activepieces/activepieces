import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteFileAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_file',
  displayName: 'Delete File',
  description: 'Permanently deletes a file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Podio file and removes it from every object it is attached to; this cannot be undone. The file id comes from Upload File, Get Files, Get Files On App or Get Files On Space.',
    idempotent: false,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the file to delete, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/file/${propsValue.fileId}` });
  },
});
