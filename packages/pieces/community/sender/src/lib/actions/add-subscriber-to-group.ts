import { createAction, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const addSubscriberToGroupAction = createAction({
  auth: senderAuth,
  name: 'add_subscriber_to_group',
  displayName: 'Add Subscriber to Group',
  description: 'Add an existing or new subscriber into one or more groups',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address',
      required: true,
    }),
    groups: Property.ShortText({
      displayName: 'Group IDs',
      description: 'Comma-separated list of group IDs',
      required: true,
    }),
  },
  async run(context) {
    const subscriberData: any = {
      email: context.propsValue.email,
      groups: context.propsValue.groups.split(',').map(id => id.trim()),
    };
    const response = await makeSenderRequest(
      context.auth,
      '/subscribers',
      HttpMethod.POST,
      subscriberData
    );

    return response.body;
  },
});
