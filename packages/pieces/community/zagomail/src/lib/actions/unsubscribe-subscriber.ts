import { zagomailAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listUId } from '../common/props';

export const unsubscribeSubscriber = createAction({
  auth: zagomailAuth,
  name: 'unsubscribeSubscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribes a subscriber.',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribes a subscriber from a specific Zagomail list, identified by the list UID and subscriber UID. Use to opt a contact out of a known list; requires both IDs. Idempotent: re-running leaves the subscriber unsubscribed.', idempotent: true },
  props: {
    listUId: listUId,
    subscriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to unsubscribe.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const listUId = propsValue.listUId;
    const subsriberUid = propsValue.subscriberUid;

    return await zagoMailApiService.unsubscribeSubscriber(
      auth.secret_text,
      listUId,
      subsriberUid
    );
  },
});
