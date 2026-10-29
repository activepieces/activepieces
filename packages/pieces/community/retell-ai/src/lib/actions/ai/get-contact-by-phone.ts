import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getContactByPhoneAction = createAction({
  auth: retellAiAuth,
  name: 'get_contact_by_phone',
  classification: 'READ',
  displayName: 'Get Contact by Phone',
  description: 'Finds the contact for a phone number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the Retell contact for a phone number (at most one exists) with name, do-not-call flag, memory notes, custom fields and conversation count. Returns found=false when there is none. Read-only.',
    idempotent: true,
  },
  props: {
    phone_number: retellAiProps.e164Number({ displayName: 'Phone Number', description: 'The phone number to look up.' }),
  },
  outputSchema: retellSchemas.contactLookup,
  async run({ auth, propsValue }) {
    const phoneNumber = retellInput.e164({ value: propsValue.phone_number, label: 'Phone Number' });
    try {
      const contact = await retellApiCall({
        apiKey: apiKeyOf(auth),
        method: HttpMethod.GET,
        path: `/get-contact-by-phone/${encodeURIComponent(phoneNumber)}`,
        retryRateLimit: true,
      });
      return { found: true, ...retellMap.contact(contact) };
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { found: false, ...retellMap.contact({ phone_number: phoneNumber }) };
      }
      throw error;
    }
  },
});
