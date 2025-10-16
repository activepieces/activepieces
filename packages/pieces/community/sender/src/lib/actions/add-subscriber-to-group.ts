import { createAction, Property } from '@activepieces/pieces-framework';
import {
  groupIdsDropdown,
  makeSenderRequest,
  senderAuth,
  subscriberDropdownSingle,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addSubscriberToGroupAction = createAction({
  auth: senderAuth,
  name: 'add_subscriber_to_group',
  displayName: 'Add Subscriber to Group',
  description: 'Add an existing or new subscriber into one or more groups',
  props: {
    subscriber: subscriberDropdownSingle,
    groups: groupIdsDropdown,
  },
  async run(context) {
    const subscriberData: any = {
      groups: context.propsValue.groups,
    };
    const response = await makeSenderRequest(
      context.auth,
      `/subscribers/${context.propsValue.subscriber}`,
      HttpMethod.PATCH,
      subscriberData
    );

    return response.body;
  },
});
