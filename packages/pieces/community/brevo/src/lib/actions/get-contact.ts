import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { brevoAuth } from '../auth';
import { brevoRequest } from '../common/client';

export const getContactAction = createAction({
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Get a Brevo contact by email or numeric contact ID.',
  auth: brevoAuth,
  props: {
    identifier: Property.ShortText({ displayName: 'Identifier', required: true }),
    identifierType: Property.StaticDropdown({
      displayName: 'Identifier Type',
      required: true,
      defaultValue: 'email_id',
      options: { options: [
        { label: 'Email', value: 'email_id' },
        { label: 'Contact ID', value: 'contact_id' },
      ] },
    }),
  },
  async run(context) {
    const id = encodeURIComponent(String(context.propsValue.identifier));
    return brevoRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/contacts/${id}`,
      queryParams: {
        identifierType: String(context.propsValue.identifierType),
      },
    });
  },
});
