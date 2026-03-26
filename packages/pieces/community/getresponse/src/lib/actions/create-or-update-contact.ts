import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth } from '../common/auth';
import {
  createGetResponseContact,
  flattenGetResponseContact,
  listGetResponseContacts,
  updateGetResponseContact,
} from '../common/client';
import { getresponseProps } from '../common/props';

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
      apiKey: context.auth.secret_text,
      email,
      campaignId,
    });

    if (!existingContact) {
      const createdContact = await createGetResponseContact({
        apiKey: context.auth.secret_text,
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
      apiKey: context.auth.secret_text,
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
  apiKey,
  email,
  campaignId,
}: {
  apiKey: string;
  email: string;
  campaignId: string;
}) {
  const contacts = await listGetResponseContacts({
    apiKey,
    email,
    campaignId,
  });

  return contacts.find(
    (contact) => contact.email.toLowerCase() === email.toLowerCase(),
  );
}

function requireString(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}
