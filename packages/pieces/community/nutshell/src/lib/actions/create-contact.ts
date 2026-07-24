import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const createContact = createAction({
  auth: nutshellAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new person contact in Nutshell with a name and optional email, phone, and links to existing companies or tags. Use to record a new individual. Not idempotent: calling it repeatedly creates duplicate contacts.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    accountIds: Property.Array({
      displayName: 'Company IDs',
      description: 'IDs of companies to link to this contact, e.g. "12-accounts".',
      required: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell.',
      required: false,
    }),
  },
  async run(context) {
    const { name, email, phone, description, accountIds, tagIds, customFields } = context.propsValue;

    const links: Record<string, unknown> = {};
    if (accountIds && accountIds.length > 0) links['accounts'] = accountIds;
    if (tagIds && tagIds.length > 0) links['tags'] = tagIds;

    const contact: Record<string, unknown> = { name };
    if (description) contact['description'] = description;
    if (email) contact['emails'] = [{ isPrimary: true, value: email }];
    if (phone) contact['phones'] = [{ isPrimary: true, value: { number: phone } }];
    if (customFields) contact['customFields'] = customFields;
    if (Object.keys(links).length > 0) contact['links'] = links;

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/contacts',
      body: { contacts: [contact] },
    });

    return unwrapFirst(response, 'contacts');
  },
});
