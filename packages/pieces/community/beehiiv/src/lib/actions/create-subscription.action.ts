import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { beehiivAuth } from "../../index";
import { BEEHIIV_API_URL } from '../common/constants';

export const createSubscriptionAction = createAction({
  auth: beehiivAuth,
  name: 'create_subscription',
  displayName: 'Create Subscription',
  description: 'Create a new subscriber in Beehiiv.',
  props: {
    publicationId: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The ID of the publication (e.g., pub_00000000-0000-0000-0000-000000000000)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the new subscriber.',
      required: true,
    }),
    reactivate_existing: Property.Checkbox({
      displayName: 'Reactivate Existing',
      description: 'Whether to reactivate the subscription if they have already unsubscribed. Use only if the subscriber is knowingly resubscribing.',
      required: false,
      defaultValue: false,
    }),
    send_welcome_email: Property.Checkbox({
      displayName: 'Send Welcome Email',
      description: 'Whether to send the default welcome email to the subscriber.',
      required: false,
      defaultValue: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source',
      description: 'The source of the subscription.',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'The medium of the subscription.',
      required: false,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'The acquisition campaign of the subscription.',
      required: false,
    }),
    referring_site: Property.ShortText({
      displayName: 'Referring Site',
      description: 'The website that the subscriber was referred from.',
      required: false,
    }),
    referral_code: Property.ShortText({
      displayName: 'Referral Code',
      description: 'A subscriber\'s referral_code to give them credit for the new subscription.',
      required: false,
    }),
    custom_fields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields that already exist for the publication. New custom fields here will be discarded.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          description: 'The name of the existing custom field.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value for the custom field.',
          required: true,
        }),
      }
    }),
    stripe_customer_id: Property.ShortText({
        displayName: 'Stripe Customer ID',
        description: 'The Stripe customer ID for this subscription.',
        required: false,
    }),
    double_opt_override: Property.ShortText({
        displayName: 'Double Opt-in Override',
        description: 'Override publication double-opt settings for this subscription.',
        required: false,
    }),
    tier: Property.StaticDropdown({
        displayName: 'Subscription Tier',
        description: 'The tier for this subscription.',
        required: false,
        options: {
            options: [
                { label: 'Free', value: 'free' },
                { label: 'Premium', value: 'premium' },
            ]
        }
    }),
    premium_tier_ids: Property.Array({
        displayName: 'Premium Tier IDs',
        description: 'The IDs of the premium tiers this subscription is associated with.',
        required: false,
        properties: {
            id: Property.ShortText({
                displayName: 'Tier ID',
                description: 'ID of the premium tier.',
                required: true,
            })
        }
    }),
    automation_ids: Property.Array({
        displayName: 'Automation IDs',
        description: 'Enroll the subscriber into automations after their subscription has been created.',
        required: false,
        properties: {
            id: Property.ShortText({
                displayName: 'Automation ID',
                description: 'ID of the automation.',
                required: true,
            })
        }
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { publicationId, ...requestBody } = propsValue;

    const cleanedRequestBody = {
        ...requestBody,
        custom_fields: (propsValue.custom_fields as { name: string, value: string }[])?.map(cf => ({ name: cf.name, value: cf.value })),
        premium_tier_ids: (propsValue.premium_tier_ids as { id: string }[])?.map(pt => pt.id),
        automation_ids: (propsValue.automation_ids as { id: string }[])?.map(ai => ai.id),
    };

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publicationId}/subscriptions`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: cleanedRequestBody,
    });
  },
});
