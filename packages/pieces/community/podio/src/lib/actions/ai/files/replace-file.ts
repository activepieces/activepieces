import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const replaceFileAction = createAction({
  auth: podioAuth,
  name: 'podio_replace_file',
  displayName: 'Replace File',
  description: 'Marks a newly uploaded file as the replacement for an older file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a newly uploaded Podio file as the new version of an older file, which it then replaces wherever the old one was attached. Upload the new file first with Upload File; only attachment files can be replaced. The old file id comes from Upload File, Get Files, Get Files On App or Get Files On Space.',
    idempotent: false,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'New File ID', description: 'The id of the new file, from Upload File.' }),
    oldFileId: podioAiProps.id({ required: true, displayName: 'Old File ID', description: 'The id of the file to replace, from Upload File, Get Files, Get Files On App or Get Files On Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/file/${propsValue.fileId}/replace`,
      body: { old_file_id: Number(propsValue.oldFileId) },
    });
  },
});
