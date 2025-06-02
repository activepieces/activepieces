import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const changeState = createAction({
  auth: crispAuth,
  name: 'change_state',
  displayName: 'Change Conversation State',
  description: 'Updates the state of a conversation',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      required: true
    }),
    state: Property.StaticDropdown({
      displayName: 'New State',
      required: true,
      options: {
        options: [
          { label: 'Unresolved', value: 'unresolved' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Not Seen', value: 'notseen' }
        ]
      }
    })
  },
  async run(context) {
    return await crispClient.makeRequest(
      context.auth.access_token,
      HttpMethod.PATCH,
      `/website/${context.propsValue.websiteId}/conversation/${context.propsValue.sessionId}/state`,
      { state: context.propsValue.state }
    );
  }
});