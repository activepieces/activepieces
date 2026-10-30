import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const downloadFileContentAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_download_file_content',
  displayName: 'Download Batch File Content',
  description: 'Download a batch input, output or error file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Downloads a batch file, typically a finished batch's output_file_id or error_file_id from Get Batch, and returns it as a file reference. Output files are JSONL, one result per input line.",
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File id ("file_..."), from Get Batch or List Batch Files.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name to save the file as. Defaults to "<file id>.jsonl".',
      required: false,
    }),
  },
  async run(context) {
    const { fileId, fileName } = context.propsValue;
    const data = await perplexityAiClient.download({
      auth: context.auth,
      path: `/v1/files/${encodeURIComponent(fileId)}/content`,
    });
    const name = fileName ?? `${fileId}.jsonl`;
    const file = await context.files.write({ fileName: name, data });
    return { file, file_name: name, size: data.length };
  },
});
