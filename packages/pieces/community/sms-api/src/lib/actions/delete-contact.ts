import { createAction, Property } from '@activepieces/pieces-framework';
import { SMSAPIAuth } from '../common/auth';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const deleteContact = createAction({
  auth: SMSAPIAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Delete a contact from SMSAPI contacts database',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to delete',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.smsapi.com/contacts/${contactId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body;
  },
});
