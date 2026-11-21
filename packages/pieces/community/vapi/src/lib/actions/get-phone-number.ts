import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const getPhoneNumber = createAction({
  auth: vapiAuth,
  name: 'get_phone_number',
  classification: 'READ',
  displayName: 'Get Phone Number',
  description: 'Get the details of a phone number by its ID.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.phoneNumber,
  aiMetadata: {
    description:
      'Returns one Vapi phone number by ID: the number, name, provider, status, and the assistant or squad that answers it. Get the ID from Find Phone Number. Read-only.',
    idempotent: true,
  },
  props: {
    phoneNumberId: Property.ShortText({ displayName: 'Phone Number ID', description: 'ID of the phone number.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.phoneNumberId, fieldName: 'Phone Number ID' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/phone-number/${id}`,
      operation: 'get phone number',
    });
    return vapiUtils.stripSecrets(item);
  },
});
