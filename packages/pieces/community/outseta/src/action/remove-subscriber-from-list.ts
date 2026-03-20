import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { emailListUidDropdown } from '../common/dropdowns';

export const removeSubscriberFromListAction = createAction({
  name: 'remove_subscriber_from_list',
  auth: outsetaAuth,
  displayName: 'Unsubscribe from Email List',
  description: 'Remove a subscriber from an email list.',
  props: {
    emailListUid: emailListUidDropdown(),
    subscriptionUid: Property.ShortText({
      displayName: 'Subscription UID',
      required: true,
      description: 'The email list subscription UID to remove.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.delete<any>(
      `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions/${context.propsValue.subscriptionUid}`
    );

    return {
      email_list_uid: context.propsValue.emailListUid,
      subscription_uid: context.propsValue.subscriptionUid,
      removed: true,
    };
  },
});
