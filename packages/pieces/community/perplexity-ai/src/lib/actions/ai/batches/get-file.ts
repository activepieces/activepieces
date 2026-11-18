import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiGetFileOutputSchema } from '../../../output-schemas';

export const getFileAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_get_file',
  outputSchema: perplexityAiGetFileOutputSchema,
  displayName: 'Get Batch File',
  description: "Get a batch file's metadata.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Reads one batch file's metadata: name, purpose, size and expiry. Use Download Batch File Content for its content.",
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description:
        'File id ("file_..."), from Upload Batch File, List Batch Files or a batch\'s output_file_id.',
      required: true,
    }),
  },
  async run(context) {
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${encodeURIComponent(context.propsValue.fileId)}`,
    });
  },
});
