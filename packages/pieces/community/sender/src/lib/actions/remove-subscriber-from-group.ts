import { createAction, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const removeSubscriberFromGroupAction = createAction({
  auth: senderAuth,
  name: 'remove_subscriber_from_group',
  displayName: 'Remove Subscriber from Group',
  description: 'Remove a subscriber from a specific group',
  props: {
    subscribers: Property.ShortText({
      displayName: 'Email(s)',
      description: 'Subscriber email address(es) - comma-separated for multiple',
      required: true,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the group to remove subscriber from',
      required: true,
    }),
  },
  async run(context) {
    const subscribers = context.propsValue.subscribers.split(',').map(email => email.trim());
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