import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vibeProspectingAuth } from '../auth';
import { exploriumApiCall, resolveApiKey } from '../common';

export const enrichContactsInformation = createAction({
  auth: vibeProspectingAuth,
  name: 'enrich_contacts_information',
  displayName: 'Enrich Contacts Information',
  description:
    'Enrich a prospect with contact details such as email and phone by prospect ID',
  props: {
    prospect_id: Property.ShortText({
      displayName: 'Prospect ID',
      description: 'Explorium prospect_id (40-character hex string)',
      required: true,
    }),
    contact_types: Property.StaticMultiSelectDropdown({
      displayName: 'Contact Types',
      description: 'Optional contact types to request',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      prospect_id: propsValue.prospect_id,
    };
    if (propsValue.contact_types && propsValue.contact_types.length > 0) {
      body.parameters = {
        contact_types: propsValue.contact_types,
      };
    }
    return exploriumApiCall({
      apiKey: resolveApiKey(auth),
      method: HttpMethod.POST,
      path: '/v1/prospects/contacts_information/enrich',
      body,
    });
  },
});
