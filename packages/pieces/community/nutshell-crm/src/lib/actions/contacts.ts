import { createAction, Property } from '@activepieces/pieces-framework';
import { nutshellAuth } from '../auth';
import { nutshellClient } from '../common/client';

const getContactAction = createAction({
  auth: nutshellAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a contact by ID from Nutshell CRM',
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.getContact(auth, propsValue.contactId);
  },
});

const createContactAction = createAction({
  auth: nutshellAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Nutshell CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Full name of the contact',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const contact: Record<string, unknown> = {
      name: propsValue.name,
    };
    if (propsValue.email) contact.email = propsValue.email;
    if (propsValue.phone) contact.phone = propsValue.phone;
    if (propsValue.title) contact.title = propsValue.title;
    return await nutshellClient.createContact(auth, contact);
  },
});

const updateContactAction = createAction({
  auth: nutshellAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Nutshell CRM',
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Updated name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Updated phone',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const contact: Record<string, unknown> = {};
    if (propsValue.name) contact.name = propsValue.name;
    if (propsValue.email) contact.email = propsValue.email;
    if (propsValue.phone) contact.phone = propsValue.phone;
    return await nutshellClient.updateContact(auth, propsValue.contactId, contact);
  },
});

const searchContactsAction = createAction({
  auth: nutshellAuth,
  name: 'search_contacts',
  displayName: 'Search Contacts',
  description: 'Search for contacts in Nutshell CRM',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find contacts',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results (default 25)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.searchContacts(auth, propsValue.query, propsValue.limit ?? 25);
  },
});

export { getContactAction, createContactAction, updateContactAction, searchContactsAction };
