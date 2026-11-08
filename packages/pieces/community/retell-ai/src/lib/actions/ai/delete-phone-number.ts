import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const deletePhoneNumberAction = createAction({
  auth: retellAiAuth,
  name: 'delete_phone_number',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Phone Number',
  description: 'Releases a phone number from the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Releases one Retell phone number; calls to it stop working and a bought number usually cannot be bought back. Cannot be undone. A number that is already gone returns already_deleted=true.',
    idempotent: false,
  },
  props: {
    phone_number: retellAiProps.e164Number({ displayName: 'Phone Number', description: 'The Retell number to release.' }),
  },
  outputSchema: retellSchemas.deleted({ idKey: 'phone_number', idLabel: 'Phone Number' }),
  async run({ auth, propsValue }) {
    const phoneNumber = retellInput.e164({ value: propsValue.phone_number, label: 'Phone Number' });
    try {
      await retellApiCall({
        apiKey: apiKeyOf(auth),
        method: HttpMethod.DELETE,
        path: `/delete-phone-number/${encodeURIComponent(phoneNumber)}`,
      });
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { phone_number: phoneNumber, deleted: false, already_deleted: true };
      }
      throw error;
    }
    return { phone_number: phoneNumber, deleted: true, already_deleted: false };
  },
});
