import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { SystemeContact, systemeIoCommon, systemeIoInput } from '../common/client';
import { contactPicker } from '../common/dropdowns';
import { getContactActionOutputSchema } from '../output-schemas';

export const getContact = createAction({
  auth: systemeIoAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get a contact with its fields and tags',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one Systeme.io contact by its numeric id, including all contact field values and assigned tags. Use when you already have the contact id (from a trigger or a search); use Find Contact by Email when you only have the email. Read-only and idempotent; fails with a not-found error for an unknown id.',
    idempotent: true,
  },
  props: {
    contact_id: contactPicker({ required: true }),
  },
  outputSchema: getContactActionOutputSchema,
  async run(context) {
    const contactId = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'Contact' });
    return systemeIoCommon.apiCall<SystemeContact>({
      method: HttpMethod.GET,
      url: `/contacts/${contactId}`,
      auth: context.auth.secret_text,
    });
  },
});
