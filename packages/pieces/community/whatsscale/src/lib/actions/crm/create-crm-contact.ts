import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';

export const createCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_create_crm_contact',
  displayName: 'Create a CRM Contact',
  description: 'Add a new contact to your WhatsScale CRM',
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'With country code e.g. +31612345678',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the contact (e.g. John Smith)',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags (e.g. vip, customer, lead). Tags are automatically lowercased.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { phone, name, tags } = context.propsValue;

    const body: Record<string, unknown> = { phone };
    if (name) body['name'] = name;
    if (tags) body['tags'] = tags;

    const response = await whatsscaleClient(auth, HttpMethod.POST, '/api/crm/contacts', body);
    return response.body;
  },
});
