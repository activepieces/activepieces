import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const deleteFileAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_delete_file',
  displayName: 'Delete Batch File',
  description: 'Permanently delete a batch file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a batch file; it cannot be restored. Batches already created from it are not affected.',
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File id ("file_..."), from List Batch Files.',
      required: true,
    }),
  },
  async run(context) {
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/v1/files/${encodeURIComponent(context.propsValue.fileId)}`,
    });
  },
});
