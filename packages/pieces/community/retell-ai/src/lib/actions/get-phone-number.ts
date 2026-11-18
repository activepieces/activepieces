import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { retellSchemas } from '../common/schemas';

export const getPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'get_phone_number',
  classification: 'READ',
  displayName: 'Get Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Retell phone number (E.164) with its nickname and the inbound/outbound agents bound to it. Use List Phone Numbers to discover numbers. Read-only.',
    idempotent: true,
  },
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'E.164 format of the number (+country code, then number with no space, no special characters), used as the unique identifier for phone number APIs. Example: "+14157774444"',
      required: true,
    }),
  },
  outputSchema: retellSchemas.rawPhoneNumber,
  async run({ propsValue, auth }) {
    const phoneNumber = retellInput.e164({ value: propsValue.phoneNumber, label: 'Phone Number' });
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-phone-number/${encodeURIComponent(phoneNumber)}`,
      retryRateLimit: true,
    });
  },
});
