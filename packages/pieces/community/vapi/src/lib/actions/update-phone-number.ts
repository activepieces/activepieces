import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const updatePhoneNumber = createAction({
  auth: vapiAuth,
  name: 'update_phone_number',
  classification: 'WRITE',
  displayName: 'Update Phone Number',
  description: 'Rename a phone number or choose the assistant or squad that answers it.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.phoneNumber,
  aiMetadata: {
    description:
      'Updates a Vapi phone number by ID: set its name, or set which assistant (Assistant ID) or squad (Squad ID) answers inbound calls to it. Give at most one of Assistant ID and Squad ID. Fields left empty are not changed. Get IDs from Find Phone Number, Find Assistant and Find Squad. Returns the updated phone number. Applying the same values again changes nothing: idempotent.',
    idempotent: true,
  },
  props: {
    phoneNumberId: Property.ShortText({ displayName: 'Phone Number ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    assistantId: Property.ShortText({ displayName: 'Assistant ID', description: 'Assistant that answers inbound calls.', required: false }),
    squadId: Property.ShortText({ displayName: 'Squad ID', description: 'Squad that answers inbound calls.', required: false }),
  },
  async run(context) {
    const { phoneNumberId, name, assistantId, squadId } = context.propsValue;
    const id = vapiUtils.requireId({ value: phoneNumberId, fieldName: 'Phone Number ID' });
    const assistant = assistantId?.trim() ?? '';
    const squad = squadId?.trim() ?? '';
    if (assistant !== '' && squad !== '') {
      throw new Error('Give either Assistant ID or Squad ID, not both.');
    }
    const body: Record<string, unknown> = {};
    if (name && name.trim() !== '') body['name'] = name.trim();
    if (assistant !== '') {
      vapiUtils.requireId({ value: assistant, fieldName: 'Assistant ID' });
      body['assistantId'] = assistant;
    }
    if (squad !== '') {
      vapiUtils.requireId({ value: squad, fieldName: 'Squad ID' });
      body['squadId'] = squad;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update: Name, Assistant ID or Squad ID.');
    }
    const phoneNumber = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/phone-number/${id}`,
      operation: 'update phone number',
      body,
    });
    return vapiUtils.stripSecrets(phoneNumber);
  },
});
