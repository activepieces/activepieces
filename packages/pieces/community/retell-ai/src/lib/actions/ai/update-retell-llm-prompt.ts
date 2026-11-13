import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const updateRetellLlmPromptAction = createAction({
  auth: retellAiAuth,
  name: 'update_retell_llm_prompt',
  classification: 'WRITE',
  displayName: 'Update Retell LLM Prompt',
  description: 'Changes the prompt, begin message or model of a Retell LLM.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Replaces the general prompt, begin message and/or model of one Retell LLM response engine's draft; only fields you set are sent. Agents on a published version keep the old prompt until the agent is published again. Safe to retry with the same values.",
    idempotent: true,
  },
  props: {
    llm_id: retellAiProps.id({ displayName: 'Retell LLM ID', description: 'The llm_id of the response engine.' }),
    general_prompt: Property.LongText({ displayName: 'General Prompt', description: 'Optional new system prompt (replaces the old one).', required: false }),
    begin_message: Property.LongText({ displayName: 'Begin Message', description: 'Optional first sentence the agent says.', required: false }),
    clear_begin_message: Property.Checkbox({
      displayName: 'Clear Begin Message',
      description: 'Remove the begin message so the agent generates its own opener.',
      required: false,
      defaultValue: false,
    }),
    model: Property.ShortText({ displayName: 'Model', description: 'Optional model name, for example gpt-4.1 or claude-4.5-sonnet.', required: false }),
  },
  outputSchema: retellSchemas.llm,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    const prompt = retellInput.optionalText(propsValue.general_prompt);
    if (prompt !== undefined) {
      body['general_prompt'] = prompt;
    }
    const beginMessage = retellInput.optionalText(propsValue.begin_message);
    if (beginMessage !== undefined && propsValue.clear_begin_message === true) {
      throw new Error('Set Begin Message or Clear Begin Message, not both.');
    }
    if (beginMessage !== undefined) {
      body['begin_message'] = beginMessage;
    } else if (propsValue.clear_begin_message === true) {
      body['begin_message'] = null;
    }
    const model = retellInput.optionalText(propsValue.model);
    if (model !== undefined) {
      body['model'] = model;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const llm = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.PATCH,
      path: `/update-retell-llm/${retellInput.seg({ value: propsValue.llm_id, label: 'Retell LLM ID' })}`,
      body,
      retryRateLimit: true,
    });
    return retellMap.retellLlm(llm);
  },
});
