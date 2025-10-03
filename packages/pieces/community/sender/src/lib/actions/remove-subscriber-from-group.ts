import { createAction, Property } from '@activepieces/pieces-framework';
import {
  groupIdDropdown,
  makeSenderRequest,
  senderAuth,
  subscribersDropdown,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeSubscriberFromGroupAction = createAction({
  auth: senderAuth,
  name: 'remove_subscriber_from_group',
  displayName: 'Remove Subscriber from Group',
  description: 'Remove a subscriber from a specific group',
  props: {
    subscribers: subscribersDropdown,
    groupId: groupIdDropdown,
  },
  async run(context) {
    const subscribers = context.propsValue.subscribers;
    const groupId = context.propsValue.groupId;

    const requestBody = {
      subscribers: subscribers,
    };

    const response = await makeSenderRequest(
      context.auth,
      `/subscribers/groups/${groupId}`,
      HttpMethod.DELETE,
      requestBody
    );

    return {
      success: true,
      subscribers,
      groupId,
      removedAt: new Date().toISOString(),
      response: response.body,
    };
  },
});
