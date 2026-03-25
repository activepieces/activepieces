import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { createVapiClient } from '../common/client';
import type Vapi from '@vapi-ai/server-sdk';

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
      description: 'The system prompt that guides the assistant behavior.',
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
    const client = createVapiClient(context.auth);
    const { assistantId, name, firstMessage, instructions, endCallMessage, overrides } =
      context.propsValue;

    const request: Vapi.UpdateAssistantDto = {
      id: assistantId,
    };

    if (name) request.name = name;
    if (firstMessage) request.firstMessage = firstMessage;
    if (endCallMessage) request.endCallMessage = endCallMessage;
    if (instructions) {
      request.model = {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: instructions }],
      } as Vapi.UpdateAssistantDtoModel;
    }

    // Merge additional overrides (explicit fields take priority)
    if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
      const base = overrides as Record<string, unknown>;
      for (const [key, value] of Object.entries(base)) {
        if (!(key in request) && key !== 'id') {
          (request as Record<string, unknown>)[key] = value;
        }
      }
    }

    const assistant = await client.assistants.update(request);
    return assistant;
  },
});
