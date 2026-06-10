import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const updateCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_update_crm_contact',
  displayName: 'Update a CRM Contact',
  description: 'Update the name or tags of an existing CRM contact',
  props: {
    contactId: whatsscaleProps.crmContact,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Leave empty to keep the current name unchanged. Set to a blank value to clear it.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Replaces all existing tags. Comma-separated (e.g. vip, lead). Leave empty to keep current tags unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId, name, tags } = context.propsValue;

      const body: Record<string, unknown> = {};
      if (name !== undefined && name !== null) body['name'] = name;
    if (tags !== undefined && tags !== null) body['tags'] = tags;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.PATCH,
      `/api/crm/contacts/${contactId}`,
      body
    );
    return response.body;
  },
});
