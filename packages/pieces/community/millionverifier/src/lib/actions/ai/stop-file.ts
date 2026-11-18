import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierAiProps } from '../../common/ai-props';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierResult } from '../../common/types';
import { millionverifierBulkResultOutputSchema } from '../../output-schemas';

export const stopFileAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_stop_file',
  outputSchema: millionverifierBulkResultOutputSchema,
  displayName: 'Stop Bulk File',
  description: 'Cancels a bulk verification file that is still in progress.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Cancels a bulk verification file that is still in progress; it cannot be resumed. Results for emails already verified can be fetched with Download Bulk Report a few seconds later.',
    idempotent: false,
  },
  props: {
    fileId: millionVerifierAiProps.fileId({ required: true }),
  },
  async run(context) {
    return await millionVerifierClient.bulkRequest<MillionVerifierResult>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/stop',
      query: { file_id: context.propsValue.fileId },
    });
  },
});
