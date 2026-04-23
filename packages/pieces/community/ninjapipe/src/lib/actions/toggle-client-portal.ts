import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const toggleClientPortal = createAction({
  auth: ninjapipeAuth,
  name: 'toggle_client_portal',
  displayName: 'Toggle Client Portal',
  description: 'Enable or disable the client portal for a contact.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    enable: Property.Checkbox({ displayName: 'Enable Client Portal', required: true, defaultValue: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const path = context.propsValue.enable
      ? `/contacts/${context.propsValue.contactId}/enable-client-portal`
      : `/contacts/${context.propsValue.contactId}/disable-client-portal`;
    const response = await ninjapipeApiCall<Record<string, any>>({
      auth,
      method: HttpMethod.PUT,
      path,
    });
    return flattenCustomFields(response.body);
  },
});
