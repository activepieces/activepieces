import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const aiGenerateTextAction = createAction({
  auth: boxAuth,
  name: 'box_ai_generate_text',
  displayName: 'Generate Text with Box AI',
  description: 'Generates text with Box AI using one Box file as context.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Generates new text (drafts, rewrites, summaries in a given style) from a prompt, using one Box file as context; use Ask Box AI to answer questions about files instead. Uses the account\'s Box AI units and does not change the file. Get the file ID from Search or List Folder Items.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({ displayName: 'Prompt', description: 'What to generate, up to 10,000 characters.', required: true }),
    fileId: boxAiProps.fileId({ required: true }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Text to use as the file\'s content instead of the stored file text, e.g. an edited draft.',
      required: false,
    }),
    dialogueHistory: Property.Json({
      displayName: 'Dialogue History',
      description: 'Earlier turns for follow-up requests: [{"prompt": "...", "answer": "...", "created_at": "2024-01-01T00:00:00Z"}].',
      required: false,
    }),
    aiAgent: Property.Json({
      displayName: 'AI Agent',
      description: 'Agent override: {"type": "ai_agent_id", "id": "<agent id>"} for an AI Studio agent from List AI Agents, or a text_gen config from Get AI Agent Default Config. Leave empty for the default.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/ai/text_gen',
      body: {
        prompt: propsValue.prompt,
        items: [{ id: propsValue.fileId, type: 'file', ...(propsValue.content !== undefined ? { content: propsValue.content } : {}) }],
        ...(propsValue.dialogueHistory !== undefined ? { dialogue_history: propsValue.dialogueHistory } : {}),
        ...(propsValue.aiAgent !== undefined ? { ai_agent: propsValue.aiAgent } : {}),
      },
    });
  },
});
