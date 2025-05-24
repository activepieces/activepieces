import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { BEEHIIV_API_URL } from "../common/constants";
import { beehiivAuth } from "../../index";

export const updateSubscriptionAction = createAction({
  auth: beehiivAuth,
  name: 'update_subscription',
  displayName: 'Update Subscription',
  description: 'Update an existing subscriber in Beehiiv.',
  props: {
    publicationId: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The ID of the publication (e.g., pub_00000000-0000-0000-0000-000000000000)',
      required: true,
    }),
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The ID of the subscription to update (e.g., sub_00000000-0000-0000-0000-000000000000)',
      required: true,
    }),
    tier: Property.StaticDropdown({
      displayName: 'Subscription Tier',
      description: 'Set the tier for this subscription.',
      required: false,
      options: {
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Premium', value: 'premium' },
        ]
      }
    }),
    stripe_customer_id: Property.ShortText({
      displayName: 'Stripe Customer ID',
      description: 'The Stripe Customer ID of the subscription.',
      required: false,
    }),
    unsubscribe: Property.Checkbox({
      displayName: 'Unsubscribe',
      description: 'Whether to unsubscribe this subscription from the publication.',
      required: false,
    }),
    custom_fields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields to update. Custom fields must already exist for the publication.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          description: 'The name of the existing custom field.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value for the custom field. Leave blank if only deleting.',
          required: false,
        }),
        delete: Property.Checkbox({
          displayName: 'Delete Field',
          description: 'Set to true to delete this custom field entry from the subscription.',
          required: false,
          defaultValue: false,
        }),
      }
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const publicationId = propsValue['publicationId'];
    const subscriptionId = propsValue['subscriptionId'];

    const body: Record<string, unknown> = {};

    if (propsValue['tier'] !== undefined) {
      body['tier'] = propsValue['tier'];
    }
    if (propsValue['stripe_customer_id'] !== undefined) {
      body['stripe_customer_id'] = propsValue['stripe_customer_id'];
    }
    if (propsValue['unsubscribe'] !== undefined) {
      body['unsubscribe'] = propsValue['unsubscribe'];
    }

    if (propsValue['custom_fields'] &&
        Array.isArray(propsValue['custom_fields']) &&
        (propsValue['custom_fields'] as unknown[]).length > 0) {
      body['custom_fields'] = (propsValue['custom_fields'] as { name: string, value?: string, delete?: boolean }[]).map(cf => {
        const field: { name: string, value?: string, delete?: boolean } = { name: cf.name };
        if (cf.value !== undefined) field.value = cf.value;
        if (cf.delete !== undefined) field.delete = cf.delete;
        return field;
      });
    }

    return await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BEEHIIV_API_URL}/publications/${publicationId}/subscriptions/${subscriptionId}`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });
  },
});
