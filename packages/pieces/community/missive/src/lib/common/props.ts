import { Property } from '@activepieces/pieces-framework';
import { getContactBooks, getContactGroups } from './utils';

export const contactBookDropdown = Property.Dropdown({
  displayName: 'Contact Book',
  description: 'Select a contact book',
  required: true,
  refreshers: [],
  options: async () => {
    const contactBooks = await getContactBooks('');
    return {
      disabled: false,
      options: contactBooks.map((book) => ({
        label: book.name,
        value: book.id,
      })),
    };
  },
});

export const contactGroupDropdown = Property.Dropdown({
  displayName: 'Contact Group',
  description: 'Select a contact group (optional)',
  required: false,
  refreshers: ['contactBookId'],
  options: async (propsValue) => {
    const contactBookId = propsValue.contactBookId as string;
    if (!contactBookId) {
      return {
        disabled: true,
        options: [],
      };
    }
    const contactGroups = await getContactGroups('', contactBookId);
    return {
      disabled: false,
      options: contactGroups.map((group) => ({
        label: group.name,
        value: group.id,
      })),
    };
  },
});

export const contactBookIdProperty = Property.ShortText({
  displayName: 'Contact Book ID',
  description: 'The ID of the contact book',
  required: true,
});

export const contactGroupIdProperty = Property.ShortText({
  displayName: 'Contact Group ID',
  description: 'The ID of the contact group (optional)',
  required: false,
});

export const conversationIdProperty = Property.ShortText({
  displayName: 'Conversation ID',
  description: 'The ID of the conversation',
  required: false,
});

export const assigneeIdProperty = Property.ShortText({
  displayName: 'Assignee ID',
  description: 'The ID of the user to assign the task to',
  required: false,
}); 