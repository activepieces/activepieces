import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';
import { assistantUpdater } from './update-assistant';

export const updateAssistantSettings = createAction({
  auth: vapiAuth,
  name: 'update_assistant_settings',
  classification: 'WRITE',
  displayName: 'Update Assistant Settings',
  description: "Change an assistant's name, greeting, system prompt or goodbye message.",
  audience: 'ai',
  outputSchema: vapiOutputSchemas.assistantSettings,
  aiMetadata: {
    description:
      "Updates an existing Vapi assistant by ID. Only the fields you give change: name, first message (greeting said when a call starts), system prompt (replaces only the system message; the assistant's model, tools, temperature and other messages are kept) and end-call message. Get the ID from Find Assistant. Returns the assistant's ID, name, first message, end-call message, model, provider and current system prompt. Applying the same values again leaves the assistant unchanged: idempotent.",
    idempotent: true,
  },
  props: {
    assistantId: Property.ShortText({ displayName: 'Assistant ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    firstMessage: Property.LongText({ displayName: 'First Message', description: 'What the assistant says first on a call.', required: false }),
    systemPrompt: Property.LongText({ displayName: 'System Prompt', description: "Replaces the assistant's system prompt.", required: false }),
    endCallMessage: Property.LongText({ displayName: 'End Call Message', description: 'What the assistant says before hanging up.', required: false }),
  },
  async run(context) {
    const { assistantId, name, firstMessage, systemPrompt, endCallMessage } = context.propsValue;
    const fields: Record<string, unknown> = {};
    const nameValue = assistantUpdater.optionalText(name);
    const firstMessageValue = assistantUpdater.optionalText(firstMessage);
    const endCallMessageValue = assistantUpdater.optionalText(endCallMessage);
    if (nameValue !== undefined) fields['name'] = nameValue;
    if (firstMessageValue !== undefined) fields['firstMessage'] = firstMessageValue;
    if (endCallMessageValue !== undefined) fields['endCallMessage'] = endCallMessageValue;
    const assistant = await assistantUpdater.update({
      apiKey: context.auth.secret_text,
      assistantId,
      fields,
      systemPrompt: assistantUpdater.optionalText(systemPrompt),
    });
    return vapiFlatten.assistantSettings(assistant);
  },
});
