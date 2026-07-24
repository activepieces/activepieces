import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const getContact = createAction({
  auth: nutshellAuth,
  name: 'getContact',
  displayName: 'Get Contact',
  description: 'Retrieves a contact by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Nutshell contact by its ID. Use to look up the current details of a known contact. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to retrieve, e.g. "123-contacts".',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;
    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/contacts/${contactId}`,
    });
    return unwrapFirst(response, 'contacts');
  },
});
