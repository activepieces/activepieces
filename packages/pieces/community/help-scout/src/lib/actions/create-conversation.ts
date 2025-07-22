import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { mailboxIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createConversation = createAction({
  auth: helpScoutAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: '',
  props: {
    mailboxId: mailboxIdDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: "Conversation’s subject",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Conversation type',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Chat', value: 'chat' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Conversation status',
      required: true,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
    // threads: Property.Array({
    //   displayName: 'Threads',
    //   description: 'At least one thread is required. Each thread must have a type and text.',
    //   required: true,
    //   props: {
    //     type: Property.StaticDropdown({
    //       displayName: 'Thread Type',
    //       required: true,
    //       options: {
    //         options: [
    //           { label: 'Customer', value: 'customer' },
    //           { label: 'Reply', value: 'reply' },
    //           { label: 'Note', value: 'note' },
    //           { label: 'Chat', value: 'chat' },
    //           { label: 'Phone', value: 'phone' },
    //         ],
    //       },
    //     }),
    //     text: Property.LongText({
    //       displayName: 'Text',
    //       required: true,
    //     }),
    //     customer: Property.Object({
    //       displayName: 'Thread Customer (optional, for customer thread)',
    //       required: false,
    //       props: {
    //         email: Property.ShortText({
    //           displayName: 'Email',
    //           required: false,
    //         }),
    //       },
    //     }),
    //   },
    // }),
    assignTo: Property.Number({
      displayName: 'Assign To (User ID)',
      description: 'The Help Scout user assigned to the conversation. Leave blank for default assignment.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'List of tags to add to the conversation',
      required: false,
    }),

  },
  async run({ auth, propsValue }) {
    // Action logic here

    const { mailboxId, email, lastName, firstName, type, status, assignTo, tags } = propsValue
    const body = {
      mailboxId,
      customer:
        { email, lastName, firstName, },
      type,
      status,
      assignTo,
      tags
    }
    const response = await makeRequest(auth.access_token, HttpMethod.POST, `/conversations`, body)
    return {
      success: true,
      message: "Conversation created",
      data: response
    }
  },
});
