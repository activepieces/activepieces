import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth, GetResponseAuthValue } from '../common/auth';
import {
  createGetResponseContact,
  flattenGetResponseContact,
  listGetResponseContacts,
  updateGetResponseContact,
} from '../common/client';
import { getresponseProps } from '../common/props';
import { requireString } from '../common/utils';

export const createOrUpdateContactAction = createAction({
  auth: getresponseAuth,
  name: 'create-or-update-contact',
  displayName: 'Create or Update Contact',
  description:
    'Creates a contact or updates the existing contact with the same email in the selected campaign.',
  props: {
    campaignId: getresponseProps.campaign(),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address used to find or create the contact.',
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

    const existingContact = await findExactContact({
      auth: context.auth,
      email,
      campaignId,
    });

    if (!existingContact) {
      const createdContact = await createGetResponseContact({
        auth: context.auth,
        request: {
          email,
          campaign: {
            campaignId,
          },
          ...(context.propsValue.name ? { name: context.propsValue.name } : {}),
        },
      });

      return {
        operation: 'created',
        ...flattenGetResponseContact(createdContact),
      };
    }

    const updatedContact = await updateGetResponseContact({
      auth: context.auth,
      contactId: existingContact.contactId,
      request: {
        email,
        campaign: {
          campaignId,
        },
        ...(context.propsValue.name ? { name: context.propsValue.name } : {}),
      },
    });

    return {
      operation: 'updated',
      ...flattenGetResponseContact(updatedContact),
    };
  },
});

async function findExactContact({
  auth,
  email,
  campaignId,
}: {
  auth: GetResponseAuthValue;
  email: string;
  campaignId: string;
}) {
  const contacts = await listGetResponseContacts({
    auth,
    email,
    campaignId,
  });

  return contacts.find(
    (contact) => contact.email.toLowerCase() === email.toLowerCase(),
  );
}
