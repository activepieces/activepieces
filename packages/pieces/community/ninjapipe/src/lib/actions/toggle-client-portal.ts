import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const toggleClientPortal = createAction({
  auth: ninjapipeAuth,
  name: 'toggle_client_portal',
  displayName: 'Toggle Client Portal',
  description: 'Enable or disable client portal access for a contact.',
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
    password: Property.ShortText({
      displayName: 'Portal Password',
      description: 'Optional. Min 8 characters. Used only when enabling. If left blank, a secure password is generated and returned.',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const { contactId, enable, email, password } = context.propsValue;
    if (!contactId) {
      throw new Error('Contact is required.');
    }
    const action = enable ? 'enable' : 'disable';
    const body: Record<string, unknown> = {};
    if (enable) {
      if (email) body['email'] = email;
      if (password) {
        body['password'] = password;
        body['auto_generate_password'] = false;
      } else {
        body['auto_generate_password'] = true;
      }
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
