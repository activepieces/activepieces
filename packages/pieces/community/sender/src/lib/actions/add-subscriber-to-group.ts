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
  audience: 'both',
  aiMetadata: { description: 'Assigns a single subscriber to one or more groups/lists in a Sender account, identified by their subscriber ID. Use to segment a contact for targeted campaigns. Idempotent: adding a contact already in a group leaves membership unchanged.', idempotent: true },
  props: {
    subscriber: subscriberDropdownSingle,
    groups: groupIdsDropdown,
  },
  async run(context) {
    const subscriberData: any = {
      groups: context.propsValue.groups,
    };
    const response = await makeSenderRequest(
      context.auth.secret_text,
      `/subscribers/${context.propsValue.subscriber}`,
      HttpMethod.PATCH,
      subscriberData
    );

    return response.body;
  },
});
