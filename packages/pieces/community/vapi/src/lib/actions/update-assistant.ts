import { createAction, Property } from '@activepieces/pieces-framework';
import { Vapi } from '@vapi-ai/server-sdk';
import { vapiAuth } from '../auth';
import { createVapiClient } from '../common/client';

export const updateAssistant = createAction({
  auth: vapiAuth,
  name: 'update_assistant',
  displayName: 'Update Assistant',
  description:
    'Update an existing Vapi assistant configuration (name, model, first message, etc.).',
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
      description:
        'The first message the assistant will say when a call starts.',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'System Prompt / Instructions',
      description:
        'Optional system prompt. Vapi does not expose a standalone top-level instructions field on UpdateAssistantDto, so if you provide this you must also provide both Model and Provider so the system prompt can be applied via model.messages without discarding your input silently.',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Optional model name (e.g. gpt-4o). Required if updating model config.',
      required: false,
    }),
    provider: Property.ShortText({
      displayName: 'Provider',
      description: 'Optional model provider (e.g. openai). Required if updating model config.',
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
        'Optional JSON object with additional UpdateAssistantDTO fields (e.g. model, voice, transcriber settings).',
      required: false,
    }),
  },
  async run(context) {
    const client = createVapiClient(context.auth.secret_text);
    const {
      assistantId,
      name,
      firstMessage,
      instructions,
      model,
      provider,
      endCallMessage,
      overrides,
    } = context.propsValue;

    const request: Vapi.UpdateAssistantDto = { id: assistantId };

    if (name) request.name = name;
    if (firstMessage) request.firstMessage = firstMessage;
    if (endCallMessage) request.endCallMessage = endCallMessage;

    const hasModel = Boolean(model);
    const hasProvider = Boolean(provider);
    const hasInstructions = Boolean(instructions);

    if (hasModel !== hasProvider) {
      throw new Error(
        'Model and Provider must be supplied together when updating the assistant model configuration.'
      );
    }

    if (hasInstructions && !(hasModel && hasProvider)) {
      throw new Error(
        'System Prompt / Instructions requires both Model and Provider because the Vapi SDK does not expose a standalone instructions field on UpdateAssistantDto.'
      );
    }

    if (hasModel && hasProvider) {
      request.model = {
        provider,
        model,
        ...(instructions
          ? { messages: [{ role: 'system', content: instructions }] }
          : {}),
      } as Vapi.UpdateAssistantDtoModel;
    }

    // Merge additional overrides (explicit fields take priority)
    if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
      const base = overrides as Record<string, unknown>;
      const requestRecord = request as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(base)) {
        if (!(key in request) && key !== 'id') {
          requestRecord[key] = value;
        }
      }
    }

    const assistant = await client.assistants.update(request);
    return assistant;
  },
});
