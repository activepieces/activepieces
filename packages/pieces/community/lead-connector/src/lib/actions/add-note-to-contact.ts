import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  addNoteToContact,
  getContacts,
  getUsers,
} from '../common';
import { leadConnectorAuth } from '../..';

export const addNoteToContactAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_note_to_contact',
  displayName: 'Add Note to Contact',
  description: 'Add a new note to a contact.',
  props: {
    contact: Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const contacts = await getContacts(auth as OAuth2PropertyValue);
        return {
          options: contacts.map((contact) => {
            return {
              label: contact.contactName,
              value: contact.id,
            };
          }),
        };
      },
    }),
    note: Property.ShortText({
      displayName: 'Note',
      required: true,
    }),
    user: Property.Dropdown({
      displayName: 'User',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const users = await getUsers(auth as OAuth2PropertyValue);
        return {
          options: users.map((user: any) => {
            return {
              label: `${user.firstName} ${user.lastName}`,
              value: user.id,
            };
          }),
        };
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, note, user } = propsValue;

    return await addNoteToContact(auth.access_token, contact, {
      body: note,
      userId: user,
    });
  },
});
