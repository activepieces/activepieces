import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.respond.io/v1';

export const commonProps = {
  contactId: Property.ShortText({
    displayName: 'Contact ID',
    description: 'The ID of the contact',
    required: true,
  }),
  conversationId: Property.ShortText({
    displayName: 'Conversation ID',
    description: 'The ID of the conversation',
    required: true,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: 'Email address of the contact',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: 'Phone number of the contact',
    required: false,
  }),
  name: Property.ShortText({
    displayName: 'Name',
    description: 'Full name of the contact',
    required: false,
  }),
  tags: Property.Array({
    displayName: 'Tags',
    description: 'Tags to assign to the contact',
    required: false,
  }),
  assigneeId: Property.ShortText({
    displayName: 'Assignee ID',
    description: 'ID of the user to assign the conversation to',
    required: false,
  }),
  comment: Property.LongText({
    displayName: 'Comment',
    description: 'Comment to add to the conversation',
    required: true,
  }),
}; 