import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const unsubscribeSubscriber = createAction({
  auth: zagomailAuth,
  name: 'unsubscribeSubscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribe a subscriber',
  props: {
    listUId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list the subscriber is in',
      required: true,
    }),
    subscriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to unsubscribe',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const listUId = propsValue.listUId;
    const subsriberUid = propsValue.subscriberUid;

    return await zagoMailApiService.unsubscribeSubscriber(
      auth,
      listUId,
      subsriberUid
    );
  },
});
