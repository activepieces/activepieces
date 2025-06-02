import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addNote = createAction({
  auth: crispAuth,
  name: 'add_note',
  displayName: 'Add Note to Conversation',
  description: 'Adds an internal note to a conversation',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The conversation session ID',
      required: true
    }),
    content: Property.LongText({
      displayName: 'Note Content',
      required: true
    }),
    color: Property.StaticDropdown({
      displayName: 'Note Color',
      required: false,
      options: {
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Orange', value: 'orange' },
          { label: 'Yellow', value: 'yellow' },
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Purple', value: 'purple' }
        ]
      },
      defaultValue: 'blue'
    })
  },
  async run(context) {
    const payload = {
      content: context.propsValue.content,
      color: context.propsValue.color,
      user: {
        type: 'participant'
      }
    };

    return await crispClient.makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      `/website/${context.propsValue.websiteId}/conversation/${context.propsValue.sessionId}/note`,
      payload
    );
  }
});