import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { modelDropdown } from '../common/common';
import { countTokensActionOutputSchema } from '../output-schemas';

export const countTokensAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'count_tokens',
  classification: 'READ',
  displayName: 'Count Tokens',
  description: 'Counts how many input tokens a prompt would use for a given model, without generating a response.',
  aiMetadata: {
    description:
      'Counts the input tokens a prompt and optional system prompt would use for a given Claude model, without sending it to be answered. Use to check a prompt fits a model\'s context window or to estimate cost before calling Ask Claude or Extract Structured Data. Idempotent: it only counts, it never generates.',
    idempotent: true,
  },
  props: {
    model: modelDropdown,
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
  },
  outputSchema: countTokensActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.messages.countTokens({
      model: context.propsValue.model,
      system: context.propsValue.systemPrompt,
      messages: [{ role: 'user', content: context.propsValue.prompt }],
    });
  },
});
