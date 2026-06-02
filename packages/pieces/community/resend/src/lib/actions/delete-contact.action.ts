import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteContact = createAction({
  name: 'delete_contact',
  auth: resendAuth,
  displayName: 'Delete Contact',
  description: 'Remove a contact from an audience',
  props: {
    audience_id: resendProps.audienceId,
    contact_id: resendProps.contactId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{
      object: string;
      contact: string;
      deleted: boolean;
    }>({
      method: HttpMethod.DELETE,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts/${propsValue.contact_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});
