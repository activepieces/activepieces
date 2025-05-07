import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const createSubscription = createAction({
  name: 'create_subscription',
  displayName: 'Create Subscription',
  description: 'Add a new subscriber and optionally enroll them in an automation flow',
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: true,
    }),
    reactivate_existing: Property.Checkbox({
      displayName: 'Reactivate Existing',
      description: 'Whether to reactivate the subscription if they have already unsubscribed',
      required: false,
      defaultValue: false,
    }),
    send_welcome_email: Property.Checkbox({
      displayName: 'Send Welcome Email',
      description: 'Whether to send a welcome email to the subscriber',
      required: false,
      defaultValue: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source',
      description: 'The source of the subscription',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'The medium of the subscription',
      required: false,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'The acquisition campaign of the subscription',
      required: false,
    }),
    referring_site: Property.ShortText({
      displayName: 'Referring Site',
      description: 'The website that the subscriber was referred from',
      required: false,
    }),
    referral_code: Property.ShortText({
      displayName: 'Referral Code',
      description: 'This should be a subscribers referral_code. This gives referral credit for the new subscription',
      required: false,
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
    automation_ids: Property.Array({
      displayName: 'Automation IDs',
      description: 'Enroll the subscriber into automations after their subscription has been created',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      publication_id,
      email,
      reactivate_existing,
      send_welcome_email,
      utm_source,
      utm_medium,
      utm_campaign,
      referring_site,
      referral_code,
      custom_fields,
      tier,
      automation_ids,
    } = propsValue;

    const payload: Record<string, any> = {
      email,
      reactivate_existing,
      send_welcome_email,
    };

    if (utm_source) payload.utm_source = utm_source;
    if (utm_medium) payload.utm_medium = utm_medium;
    if (utm_campaign) payload.utm_campaign = utm_campaign;
    if (referring_site) payload.referring_site = referring_site;
    if (referral_code) payload.referral_code = referral_code;
    if (custom_fields) payload.custom_fields = custom_fields;
    if (tier) payload.tier = tier;
    if (automation_ids) payload.automation_ids = automation_ids;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/subscriptions`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
