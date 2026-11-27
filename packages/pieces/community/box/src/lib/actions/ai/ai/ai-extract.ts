import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';
import { boxAiExtractOutputSchema } from '../../../output-schemas';

export const aiExtractAction = createAction({
  auth: boxAuth,
  name: 'box_ai_extract',
  outputSchema: boxAiExtractOutputSchema,
  displayName: 'Extract with Box AI',
  description: 'Extracts information from Box files with Box AI, described in a free-form prompt.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Extracts key/value data from up to 25 Box files using a free-form prompt (plain text, XML or JSON) and returns it as an answer string; use Extract Structured with Box AI to get typed fields or fill a metadata template. Uses the account\'s Box AI units. Get file IDs from Search or List Folder Items.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'What to extract, up to 10,000 characters, e.g. "vendor, invoice number, total".',
      required: true,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'IDs of the files to extract from (1-25).',
      required: true,
    }),
    aiAgent: Property.Json({
      displayName: 'AI Agent',
      description: 'Agent override: {"type": "ai_agent_id", "id": "<agent id>"} for an AI Studio agent from List AI Agents, or an extract config from Get AI Agent Default Config. Leave empty for the default.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fileIds = propsValue.fileIds.map(String);
    if (fileIds.length === 0 || fileIds.length > 25) {
      throw new Error('File IDs must hold 1 to 25 IDs.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/ai/extract',
      body: {
        prompt: propsValue.prompt,
        items: fileIds.map((id) => ({ id, type: 'file' })),
        ...(propsValue.aiAgent !== undefined ? { ai_agent: propsValue.aiAgent } : {}),
      },
    });
  },
});
