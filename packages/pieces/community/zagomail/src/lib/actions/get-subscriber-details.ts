import { zagomailAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listUId } from '../common/props';

export const getSubscriberDetails = createAction({
  auth: zagomailAuth,
  name: 'getSubscriberDetails',
  displayName: 'Get Subscriber',
  description: 'Gets the details of a subscriber.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full details of a single subscriber in a Zagomail list, addressed directly by list UID and subscriber UID. Use when you already hold the subscriber UID; to find one from an email, use Search Subscriber first. Read-only and idempotent.', idempotent: true },
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
      auth.secret_text,
      listUId,
      subsriberUid
    );
  },
});
