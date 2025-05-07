import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const updateSubscriber = createAction({
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Modify subscriber info (name, custom fields, status)',
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The ID of the subscription to update',
      required: true,
    }),
    tier: Property.StaticDropdown({
      displayName: 'Tier',
      description: 'The tier for this subscription',
      required: false,
      options: {
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Premium', value: 'premium' },
        ],
      },
    }),
    stripe_customer_id: Property.ShortText({
      displayName: 'Stripe Customer ID',
      description: 'The Stripe Customer ID of the subscription',
      required: false,
    }),
    unsubscribe: Property.Checkbox({
      displayName: 'Unsubscribe',
      description: 'Whether to unsubscribe this subscription from the publication',
      required: false,
      defaultValue: false,
    }),
    custom_fields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields for the subscriber',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          description: 'The name of the custom field',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value of the custom field',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      publication_id,
      subscription_id,
      tier,
      stripe_customer_id,
      unsubscribe,
      custom_fields,
    } = propsValue;

    const payload: Record<string, any> = {};

    if (tier) payload.tier = tier;
    if (stripe_customer_id) payload.stripe_customer_id = stripe_customer_id;
    if (unsubscribe !== undefined) payload.unsubscribe = unsubscribe;
    if (custom_fields) payload.custom_fields = custom_fields;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/subscriptions/${subscription_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
