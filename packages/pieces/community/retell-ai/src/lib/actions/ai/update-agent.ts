import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const updateAgentAction = createAction({
  auth: retellAiAuth,
  name: 'update_agent',
  classification: 'WRITE',
  displayName: 'Update Agent',
  description: 'Changes the name, voice, language or webhook URL of a voice agent draft.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Changes basic settings (name, voice, language, webhook URL) of a voice agent's latest draft version; only the fields you set are sent. Calls keep using the published version until you run Publish Agent. Safe to retry with the same values.",
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice agent ID.' }),
    agent_name: Property.ShortText({ displayName: 'Agent Name', description: 'Optional new name.', required: false }),
    voice_id: Property.ShortText({ displayName: 'Voice ID', description: 'Optional voice ID, for example 11labs-Adrian. Use List Voices.', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'Optional language code such as en-US, es-ES, de-DE or multi.', required: false }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional agent webhook URL; overrides the account webhook.',
      required: false,
    }),
    clear_webhook_url: Property.Checkbox({
      displayName: 'Clear Webhook URL',
      description: 'Remove the agent-level webhook so the account webhook is used again.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: retellSchemas.agent,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    const name = retellInput.optionalText(propsValue.agent_name);
    if (name !== undefined) {
      body['agent_name'] = name;
    }
    const voiceId = retellInput.optionalText(propsValue.voice_id);
    if (voiceId !== undefined) {
      body['voice_id'] = voiceId;
    }
    const language = retellInput.optionalText(propsValue.language);
    if (language !== undefined) {
      body['language'] = language;
    }
    const webhookUrl = retellInput.optionalText(propsValue.webhook_url);
    if (webhookUrl !== undefined && propsValue.clear_webhook_url === true) {
      throw new Error('Set Webhook URL or Clear Webhook URL, not both.');
    }
    if (webhookUrl !== undefined) {
      body['webhook_url'] = webhookUrl;
    } else if (propsValue.clear_webhook_url === true) {
      body['webhook_url'] = null;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const agent = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.PATCH,
      path: `/update-agent/${retellInput.seg({ value: propsValue.agent_id, label: 'Agent ID' })}`,
      body,
      retryRateLimit: true,
    });
    return retellMap.agent(agent);
  },
});
