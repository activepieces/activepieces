import { createAction, Property } from '@activepieces/pieces-framework';
import { denserAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const processInputText = createAction({
  auth: denserAiAuth,
  name: 'processInputText',
  displayName: 'Process input text',
  description: 'Input text processed by the chatbot',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a question to a configured Denser.ai chatbot and returns its generated answer, optionally steered by a custom prompt, a chosen LLM model, and inline citations. Use it to query a Denser.ai knowledge-base chatbot for a natural-language response. Requires a question and the chatbot connection; not idempotent, since each call produces a freshly generated answer.',
    idempotent: false,
  },
  props: {
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question to be processed by the chatbot',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'The prompt to be used by the chatbot e.g., "Please provide your answer in the following format: ..."',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to be used by the chatbot (e.g., gpt-3.5, gpt-4)',
      required: false,
      options: {
        options: [
          { label: 'gpt-3.5', value: 'gpt-3.5' },
          { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
          { label: 'gpt-4', value: 'gpt-4' },
          { label: 'gpt-4o', value: 'gpt-4o' },
          { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet' },
          { label: 'claude-3-5-haiku', value: 'claude-3-5-haiku' },
          { label: 'claude-3-7-sonnet', value: 'claude-3-7-sonnet' },
        ],
      },
      defaultValue: ' gpt-4o-mini',
    }),
    citation: Property.Checkbox({
      displayName: 'Citations',
      description: 'Whether to include citations in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { question, prompt, model, citation } = context.propsValue;
    const { apiKey, chatbotId } = context.auth.props;
    const response = await makeRequest(HttpMethod.POST, `/query`, {
      question,
      prompt,
      model,
      citation,
      key: apiKey,
      chatbotId: chatbotId,
    });
    return response;
  },
});
