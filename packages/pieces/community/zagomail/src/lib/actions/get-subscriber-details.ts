import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listUId } from '../common/props';

export const getSubscriberDetails = createAction({
  auth: zagomailAuth,
  name: 'getSubscriberDetails',
  displayName: 'Get Subscriber',
  description: 'Gets the details of a subscriber.',
  props: {
    listUId: listUId,
    subscriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to get the details for.',
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
