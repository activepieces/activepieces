import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const getSubscriberDetails = createAction({
  auth: zagomailAuth,
  name: 'getSubscriberDetails',
  displayName: 'Get Subscriber Details',
  description: 'Get the details of a subscriber',
  props: {
    listUId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list the subscriber is in',
      required: true,
    }),
    subscriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to get the details for',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const listUId = propsValue.listUId;
    const subsriberUid = propsValue.subscriberUid;

    return await zagoMailApiService.getSubscriberDetails(
      auth,
      listUId,
      subsriberUid
    );
  },
});
