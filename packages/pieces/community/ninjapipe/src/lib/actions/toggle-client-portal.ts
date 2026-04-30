import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const toggleClientPortal = createAction({
  auth: ninjapipeAuth,
  name: 'toggle_client_portal',
  displayName: 'Toggle Client Portal',
  description: 'Enable or disable client portal access for a contact. When enabling, NinjaPipe auto-generates a secure password and returns it in the response.',
  props: {
    contactId: ninjapipeCommon.contactDropdownRequired,
    enable: Property.Checkbox({
      displayName: 'Enable Client Portal',
      description: 'Turn ON to enable, OFF to disable.',
      required: true,
      defaultValue: true,
    }),
    email: Property.ShortText({
      displayName: 'Portal Email',
      description: 'Optional. Used only when enabling. Defaults to the contact\'s email.',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const { contactId, enable, email } = context.propsValue;
    const action = enable ? 'enable' : 'disable';
    const body: Record<string, unknown> = {};
    if (enable) {
      if (email) body['email'] = email;
      body['auto_generate_password'] = true;
    }
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.PUT,
      path: `/client-portal-accounts/${encodeURIComponent(String(contactId))}/${encodeURIComponent(String(action))}`,
      body: enable ? body : undefined,
    });
    return flattenCustomFields(response.body);
  },
});
