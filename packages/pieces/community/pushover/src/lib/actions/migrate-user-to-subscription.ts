import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';

export const migrateUserToSubscription = createAction({
  auth: pushoverAuth,
  name: 'migrate_user_to_subscription',
  classification: 'WRITE',
  displayName: 'Migrate User to Subscription',
  description: 'Convert an existing user key into a subscribed user key',
  audience: 'ai',
  aiMetadata: {
    description:
      'Convert a user key that already authorised this application into a subscription-specific user key, returning subscribed_user_key. Only meaningful for an application owner running a Pushover subscription, and it needs the subscription code from the subscription page; there is no programmatic way to subscribe someone who has not gone through the subscription URL. Send future messages to the returned key. Not idempotent: call it once per user and store the result.',
    idempotent: false,
  },
  props: {
    subscription: Property.ShortText({
      displayName: 'Subscription Code',
      description:
        'The subscription code shown on the Pushover subscription page, for example sABCDEFGHIJKLMNOPQRSTUVWXYZ.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User Key',
      description:
        'The existing 30-character user key to migrate. Defaults to the key stored on the connection when left blank.',
      required: false,
    }),
    device_name: Property.ShortText({
      displayName: 'Device Name',
      description:
        'Migrate only this one device of the user instead of the whole account.',
      required: false,
    }),
    sound: Property.ShortText({
      displayName: 'Sound',
      description:
        'Default sound to set on the migrated subscription. Resolve an identifier with List Notification Sounds.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const suppliedUser = propsValue.user;
    const user =
      suppliedUser !== undefined && suppliedUser.length > 0
        ? suppliedUser
        : auth.props.user_key;

    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: '/subscriptions/migrate.json',
      body: {
        token: auth.props.api_token,
        subscription: propsValue.subscription,
        user,
        ...(propsValue.device_name
          ? { device_name: propsValue.device_name }
          : {}),
        ...(propsValue.sound ? { sound: propsValue.sound } : {}),
      },
    });
  },
});
