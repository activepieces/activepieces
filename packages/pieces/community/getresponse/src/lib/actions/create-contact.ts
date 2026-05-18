import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth } from '../common/auth';
import {
  createGetResponseContact,
  flattenGetResponseContact,
} from '../common/client';
import { getresponseProps } from '../common/props';
import { requireString } from '../common/utils';

export const createContactAction = createAction({
  auth: getresponseAuth,
  name: 'create-contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in a GetResponse campaign.',
  props: {
    campaignId: getresponseProps.campaign(),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to create.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The contact name as it should appear in GetResponse.',
      required: false,
    }),
  },
  async run(context) {
    const campaignId = requireString(
      context.propsValue.campaignId,
      'Campaign',
    );
    const email = requireString(context.propsValue.email, 'Email Address');

    const contact = await createGetResponseContact({
      auth: context.auth,
      request: {
        email,
        campaign: {
          campaignId,
        },
        ...(context.propsValue.name ? { name: context.propsValue.name } : {}),
      },
    });

    return flattenGetResponseContact(contact);
  },
});
