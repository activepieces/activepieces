import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierAiProps } from '../../common/ai-props';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierResult } from '../../common/types';
import { millionverifierBulkResultOutputSchema } from '../../output-schemas';

export const deleteFileAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_delete_file',
  outputSchema: millionverifierBulkResultOutputSchema,
  displayName: 'Delete Bulk File',
  description: 'Permanently deletes a bulk verification file and its results.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a bulk verification file and its results; this cannot be undone. Download Bulk Report first if the results are still needed.',
    idempotent: false,
  },
  props: {
    fileId: millionVerifierAiProps.fileId({ required: true }),
  },
  async run(context) {
    return await millionVerifierClient.bulkRequest<MillionVerifierResult>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v2/delete',
      query: { file_id: context.propsValue.fileId },
    });
  },
});
