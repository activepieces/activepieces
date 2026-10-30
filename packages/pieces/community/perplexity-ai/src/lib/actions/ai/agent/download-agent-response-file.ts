import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const downloadAgentResponseFileAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_download_agent_response_file',
  displayName: 'Download Agent Response File',
  description: 'Download a file an Agent API response produced.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads one file an Agent API response delivered with the share_file tool and returns it as a file reference. Get the file id and name from List Agent Response Files.',
    idempotent: true,
  },
  props: {
    responseId: Property.ShortText({
      displayName: 'Response ID',
      description: 'Response id ("resp_..."), from Create Agent Response.',
      required: true,
    }),
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File id from List Agent Response Files.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description:
        'Name to save the file as, e.g. the filename from List Agent Response Files. Defaults to the file id.',
      required: false,
    }),
  },
  async run(context) {
    const { responseId, fileId, fileName } = context.propsValue;
    const data = await perplexityAiClient.download({
      auth: context.auth,
      path: `/v1/agent/${encodeURIComponent(
        responseId
      )}/files/${encodeURIComponent(fileId)}/content`,
    });
    const name = fileName ?? fileId;
    const file = await context.files.write({ fileName: name, data });
    return { file, file_name: name, size: data.length };
  },
});
