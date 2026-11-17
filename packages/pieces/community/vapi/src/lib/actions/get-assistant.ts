import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const getAssistant = createAction({
  auth: vapiAuth,
  name: 'get_assistant',
  classification: 'READ',
  displayName: 'Get Assistant',
  description: 'Get the details of a assistant by its ID.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.assistant,
  aiMetadata: {
    description:
      'Returns one Vapi assistant by ID: name, first message, end-call message, model (provider, model name, temperature), voice (provider, voice ID), server URL and timestamps. Get the ID from Find Assistant. Read-only.',
    idempotent: true,
  },
  props: {
    assistantId: Property.ShortText({ displayName: 'Assistant ID', description: 'ID of the assistant.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.assistantId, fieldName: 'Assistant ID' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/assistant/${id}`,
      operation: 'get assistant',
    });
    return vapiUtils.stripSecrets(item);
  },
});
