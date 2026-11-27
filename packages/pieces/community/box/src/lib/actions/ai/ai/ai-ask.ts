import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const aiAskAction = createAction({
  auth: boxAuth,
  name: 'box_ai_ask',
  displayName: 'Ask Box AI',
  description: 'Asks Box AI a question about one or more Box files.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Answers a question using the content of up to 25 Box files (one file uses single-item mode) and returns the answer with citations. Uses the account\'s Box AI units. Get file IDs from Search or List Folder Items.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({ displayName: 'Question', description: 'The question to ask, up to 10,000 characters.', required: true }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'IDs of the files to ask about (1-25).',
      required: true,
    }),
    includeCitations: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Citations',
      description: '"true" to return the passages the answer is based on.',
    }),
    dialogueHistory: Property.Json({
      displayName: 'Dialogue History',
      description: 'Earlier turns for follow-up questions: [{"prompt": "...", "answer": "...", "created_at": "2024-01-01T00:00:00Z"}].',
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
      path: '/ai/ask',
      body: {
        mode: fileIds.length === 1 ? 'single_item_qa' : 'multiple_item_qa',
        prompt: propsValue.prompt,
        items: fileIds.map((id) => ({ id, type: 'file' })),
        ...(propsValue.includeCitations !== undefined ? { include_citations: propsValue.includeCitations === 'true' } : {}),
        ...(propsValue.dialogueHistory !== undefined ? { dialogue_history: propsValue.dialogueHistory } : {}),
      },
    });
  },
});
