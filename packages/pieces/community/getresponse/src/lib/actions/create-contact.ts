import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth } from '../common/auth';
import {
  createGetResponseContact,
  flattenGetResponseContact,
} from '../common/client';
import { getresponseProps } from '../common/props';

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
      apiKey: context.auth.secret_text,
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

function requireString(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}
