import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

const { isRecord } = vapiUtils;

function mergeAssistantModel({
  existingModel,
  overrideModel,
  provider,
  model,
  systemPrompt,
}: {
  existingModel: unknown;
  overrideModel?: unknown;
  provider?: string;
  model?: string;
  systemPrompt?: string;
}): Record<string, unknown> | undefined {
  if (overrideModel === undefined && provider === undefined && model === undefined && systemPrompt === undefined) {
    return undefined;
  }
  if (overrideModel !== undefined && !isRecord(overrideModel)) {
    throw new Error('The "model" key in Additional Overrides must be a JSON object.');
  }
  const merged: Record<string, unknown> = {
    ...(isRecord(existingModel) ? existingModel : {}),
    ...(overrideModel ?? {}),
  };
  if (provider !== undefined) {
    merged['provider'] = provider;
  }
  if (model !== undefined) {
    merged['model'] = model;
  }
  if (systemPrompt !== undefined) {
    const currentMessages = Array.isArray(merged['messages']) ? merged['messages'] : [];
    const otherMessages = currentMessages.filter((message) => !(isRecord(message) && message['role'] === 'system'));
    merged['messages'] = [{ role: 'system', content: systemPrompt }, ...otherMessages];
  }
  if (typeof merged['provider'] !== 'string' || typeof merged['model'] !== 'string') {
    throw new Error(
      'This assistant has no model configured yet. Provide both Model and Provider to set its model and system prompt.'
    );
  }
  return merged;
}

async function updateAssistantWithMerge({
  apiKey,
  assistantId,
  fields,
  overrides,
  provider,
  model,
  systemPrompt,
}: {
  apiKey: string;
  assistantId: string;
  fields: Record<string, unknown>;
  overrides?: Record<string, unknown>;
  provider?: string;
  model?: string;
  systemPrompt?: string;
}): Promise<Record<string, unknown>> {
  const id = vapiUtils.requireId({ value: assistantId, fieldName: 'Assistant ID' });
  const overrideModel = overrides?.['model'];
  const restOverrides = Object.fromEntries(
    Object.entries(overrides ?? {}).filter(([key]) => key !== 'model' && key !== 'id')
  );
  const body: Record<string, unknown> = { ...restOverrides, ...fields };
  const touchesModel =
    overrideModel !== undefined || provider !== undefined || model !== undefined || systemPrompt !== undefined;
  if (touchesModel) {
    const existing = await vapiApi.request<unknown>({
      apiKey,
      method: HttpMethod.GET,
      path: `/assistant/${id}`,
      operation: 'get assistant',
    });
    const mergedModel = mergeAssistantModel({
      existingModel: isRecord(existing) ? existing['model'] : undefined,
      overrideModel,
      provider,
      model,
      systemPrompt,
    });
    if (mergedModel) {
      body['model'] = mergedModel;
    }
  }
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  const updated = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.PATCH,
    path: `/assistant/${id}`,
    operation: 'update assistant',
    body,
  });
  return vapiUtils.stripSecrets(updated);
}

function optionalText(value: string | undefined | null): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : value;
}

export const updateAssistant = createAction({
  auth: vapiAuth,
  name: 'update_assistant',
  classification: 'WRITE',
  displayName: 'Update Assistant',
  description:
    'Update an existing Vapi assistant (name, first message, model, system prompt and any other setting). Existing tools, temperature and other model settings are kept.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.assistant,
  props: {
    assistantId: Property.ShortText({
      displayName: 'Assistant ID',
      description: 'The unique identifier of the assistant to update.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A new name for the assistant.',
      required: false,
    }),
    firstMessage: Property.LongText({
      displayName: 'First Message',
      description: 'The first message the assistant will say when a call starts.',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'System Prompt / Instructions',
      description:
        "Replaces the assistant's system prompt. Other model settings (tools, temperature, other messages) are kept.",
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Optional model name (e.g. gpt-4o). Must be given together with Provider.',
      required: false,
    }),
    provider: Property.ShortText({
      displayName: 'Provider',
      description: 'Optional model provider (e.g. openai). Must be given together with Model.',
      required: false,
    }),
    endCallMessage: Property.LongText({
      displayName: 'End Call Message',
      description: 'The message the assistant says before ending the call.',
      required: false,
    }),
    overrides: Property.Json({
      displayName: 'Additional Overrides',
      description:
        'Optional JSON object with any other assistant fields (e.g. voice, transcriber). A "model" object here is merged into the existing model. The fields above take priority.',
      required: false,
    }),
  },
  async run(context) {
    const { assistantId, name, firstMessage, instructions, model, provider, endCallMessage, overrides } =
      context.propsValue;
    const modelValue = optionalText(model);
    const providerValue = optionalText(provider);
    if ((modelValue === undefined) !== (providerValue === undefined)) {
      throw new Error('Model and Provider must be supplied together when updating the assistant model configuration.');
    }
    const fields: Record<string, unknown> = {};
    const nameValue = optionalText(name);
    const firstMessageValue = optionalText(firstMessage);
    const endCallMessageValue = optionalText(endCallMessage);
    if (nameValue !== undefined) fields['name'] = nameValue;
    if (firstMessageValue !== undefined) fields['firstMessage'] = firstMessageValue;
    if (endCallMessageValue !== undefined) fields['endCallMessage'] = endCallMessageValue;
    return updateAssistantWithMerge({
      apiKey: context.auth.secret_text,
      assistantId,
      fields,
      overrides: vapiUtils.parseJsonObject({ value: overrides, fieldName: 'Additional Overrides' }),
      provider: providerValue,
      model: modelValue,
      systemPrompt: optionalText(instructions),
    });
  },
});

export const assistantUpdater = {
  mergeModel: mergeAssistantModel,
  update: updateAssistantWithMerge,
  optionalText,
};
