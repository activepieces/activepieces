import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

function optionalText(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const createAssistant = createAction({
  auth: vapiAuth,
  name: 'create_assistant',
  classification: 'WRITE',
  displayName: 'Create Assistant',
  description: 'Create a new Vapi voice assistant.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.assistant,
  aiMetadata: {
    description:
      'Creates a new Vapi voice assistant and returns it, including its new ID. Give a name and optionally a first message (greeting), a system prompt, an end-call message, the LLM (Model Provider + Model, e.g. openai + gpt-4o, always together) and a voice (Voice Provider + Voice ID, always together). A system prompt needs Model Provider and Model. Anything left empty uses Vapi\'s defaults. Each run creates another assistant: not idempotent.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    firstMessage: Property.LongText({ displayName: 'First Message', description: 'What the assistant says first on a call.', required: false }),
    systemPrompt: Property.LongText({ displayName: 'System Prompt', description: 'Requires Model Provider and Model.', required: false }),
    modelProvider: Property.ShortText({ displayName: 'Model Provider', description: 'e.g. openai, anthropic, google. Give together with Model.', required: false }),
    model: Property.ShortText({ displayName: 'Model', description: 'e.g. gpt-4o. Give together with Model Provider.', required: false }),
    voiceProvider: Property.ShortText({ displayName: 'Voice Provider', description: 'e.g. vapi, 11labs, openai. Give together with Voice ID.', required: false }),
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'e.g. Elliot (vapi). Give together with Voice Provider.', required: false }),
    endCallMessage: Property.LongText({ displayName: 'End Call Message', required: false }),
  },
  async run(context) {
    const { name, firstMessage, systemPrompt, endCallMessage } = context.propsValue;
    const modelProvider = optionalText(context.propsValue.modelProvider);
    const model = optionalText(context.propsValue.model);
    const voiceProvider = optionalText(context.propsValue.voiceProvider);
    const voiceId = optionalText(context.propsValue.voiceId);
    const prompt = systemPrompt && systemPrompt.trim() !== '' ? systemPrompt : undefined;
    if ((modelProvider === undefined) !== (model === undefined)) {
      throw new Error('Model Provider and Model must be given together.');
    }
    if ((voiceProvider === undefined) !== (voiceId === undefined)) {
      throw new Error('Voice Provider and Voice ID must be given together.');
    }
    if (prompt !== undefined && model === undefined) {
      throw new Error('System Prompt requires Model Provider and Model.');
    }
    if (name.trim() === '') {
      throw new Error('Name is required.');
    }
    const body: Record<string, unknown> = { name: name.trim() };
    if (firstMessage) body['firstMessage'] = firstMessage;
    if (endCallMessage) body['endCallMessage'] = endCallMessage;
    if (modelProvider !== undefined && model !== undefined) {
      body['model'] = {
        provider: modelProvider,
        model,
        ...(prompt ? { messages: [{ role: 'system', content: prompt }] } : {}),
      };
    }
    if (voiceProvider !== undefined && voiceId !== undefined) {
      body['voice'] = { provider: voiceProvider, voiceId };
    }
    const assistant = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/assistant',
      operation: 'create assistant',
      body,
    });
    return vapiUtils.stripSecrets(assistant);
  },
});
