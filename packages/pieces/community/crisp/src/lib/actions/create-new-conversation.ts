import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createConversation = createAction({
  auth: crispAuth,
  name: 'create_conversation',
  displayName: 'Create New Conversation',
  description: 'Initiates a conversation with a customer',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    email: Property.ShortText({
      displayName: 'Customer Email',
      required: true
    }),
    message: Property.LongText({
      displayName: 'Initial Message',
      required: true
    }),
    type: Property.StaticDropdown({
      displayName: 'Message Type',
      required: false,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'File', value: 'file' },
          { label: 'Animation', value: 'animation' }
        ]
      },
      defaultValue: 'text'
    })
  },
  async run(context) {
    const payload = {
      type: context.propsValue.type,
      from: 'operator',
      origin: 'chat',
      content: context.propsValue.message
    };

    // create conversation
    return await crispClient.makeRequest(
      context.auth,
      HttpMethod.POST,
      `/website/${context.propsValue.websiteId}/conversation/${context.propsValue.email}/message`,
      payload
    );
  }
});