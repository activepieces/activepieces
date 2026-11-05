import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierAiProps } from '../../common/ai-props';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierBulkFile } from '../../common/types';
import { millionverifierBulkFileOutputSchema } from '../../output-schemas';

export const getFileAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_get_file',
  outputSchema: millionverifierBulkFileOutputSchema,
  displayName: 'Get Bulk File',
  description: 'Returns the status, progress and result counts of a bulk verification file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one bulk verification file: its status, percent done and counts per result. Call it to poll an upload until status is "finished", then use Download Bulk Report. Reads the status once; it does not wait. Deleted files are still returned here; List Bulk Files leaves them out.',
    idempotent: true,
  },
  props: {
    fileId: millionVerifierAiProps.fileId({ required: true }),
  },
  async run(context) {
    return await millionVerifierClient.bulkRequest<MillionVerifierBulkFile>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v2/fileinfo',
      query: { file_id: context.propsValue.fileId },
    });
  },
});
