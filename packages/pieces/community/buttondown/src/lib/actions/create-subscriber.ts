import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { buttondownAuth } from '../common/auth';
import { buttondownRequest } from '../common/client';
import {
  ButtondownSubscriber,
  ButtondownSubscriberInput,
  ButtondownSubscriberType,
} from '../common/types';

const subscriberTypeOptions: { label: string; value: ButtondownSubscriberType }[] = [
  { label: 'Regular', value: 'regular' },
  { label: 'Premium', value: 'premium' },
  { label: 'Unactivated', value: 'unactivated' },
  { label: 'Paused', value: 'paused' },
  { label: 'Trialed', value: 'trialed' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Churning', value: 'churning' },
  { label: 'Churned', value: 'churned' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
  { label: 'Undeliverable', value: 'undeliverable' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Complained', value: 'complained' },
  { label: 'Gifted', value: 'gifted' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Removed', value: 'removed' },
  { label: 'Unpaid', value: 'unpaid' },
];

export const createSubscriber = createAction({
  auth: buttondownAuth,
  name: 'createSubscriber',
  displayName: 'Create Subscriber',
  description: 'Create a new subscriber in Buttondown.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
      description: 'The email address of the subscriber.',
    }),
    type: Property.StaticDropdown({
      displayName: 'Subscriber Type',
      description:
        'Set the subscriber status. Use “regular” to bypass double opt-in.',
      required: false,
      options: {
        options: subscriberTypeOptions,
      },
    }),
    notes: Property.LongText({
      displayName: 'Internal Notes',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Add one or more tags to assign to the subscriber.',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to store on the subscriber (JSON object).',
      required: false,
    }),
    referrerUrl: Property.ShortText({
      displayName: 'Referrer URL',
      required: false,
    }),
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      required: false,
    }),
    utmMedium: Property.ShortText({
      displayName: 'UTM Medium',
      required: false,
    }),
    utmCampaign: Property.ShortText({
      displayName: 'UTM Campaign',
      required: false,
    }),
    referringSubscriberId: Property.ShortText({
      displayName: 'Referring Subscriber ID',
      description: 'ID of the subscriber who referred this contact.',
      required: false,
    }),
    ipAddress: Property.ShortText({
      displayName: 'IP Address',
      description:
        'The original IP address of the subscriber. Helps Buttondown evaluate spam.',
      required: false,
    }),
    collisionBehavior: Property.StaticDropdown({
      displayName: 'Collision Behavior',
      description:
        'Control how Buttondown handles duplicate email addresses. Leave empty to keep the existing subscriber.',
      required: false,
      options: {
        options: [
          { label: 'Overwrite existing subscriber', value: 'overwrite' },
          { label: 'Merge tags with existing subscriber', value: 'add' },
        ],
      },
    }),
    bypassFirewall: Property.Checkbox({
      displayName: 'Bypass Firewall',
      description:
        'Set to true when the request originates from a trusted internal system without the subscriber\'s IP address.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!auth?.secret_text) {
      throw new Error('Authentication is required. Connect your Buttondown account.');
    }

    const payload: ButtondownSubscriberInput = {
      email_address: propsValue.email,
    };

    if (propsValue.notes) {
      payload.notes = propsValue.notes;
    }

    const tags = (propsValue.tags as Array<{ tag?: string }> | undefined)
      ?.map((entry) => entry?.tag?.trim())
      .filter((tag): tag is string => !!tag);
    if (tags && tags.length > 0) {
      payload.tags = tags;
    }

    if (propsValue.metadata) {
      if (typeof propsValue.metadata !== 'object' || Array.isArray(propsValue.metadata)) {
        throw new Error('Metadata must be a JSON object.');
      }
      payload.metadata = propsValue.metadata as Record<string, unknown>;
    }

    if (propsValue.referrerUrl) {
      payload.referrer_url = propsValue.referrerUrl;
    }

    if (propsValue.utmSource) {
      payload.utm_source = propsValue.utmSource;
    }

    if (propsValue.utmMedium) {
      payload.utm_medium = propsValue.utmMedium;
    }

    if (propsValue.utmCampaign) {
      payload.utm_campaign = propsValue.utmCampaign;
    }

    if (propsValue.referringSubscriberId) {
      payload.referring_subscriber_id = propsValue.referringSubscriberId;
    }

    if (propsValue.type) {
      payload.type = propsValue.type as ButtondownSubscriberType;
    }

    if (propsValue.ipAddress) {
      payload.ip_address = propsValue.ipAddress;
    }

    const headers: Record<string, string | undefined> = {
      'X-Buttondown-Collision-Behavior': propsValue.collisionBehavior as string | undefined,
      'X-Buttondown-Bypass-Firewall': propsValue.bypassFirewall ? 'true' : undefined,
    };

    const subscriber = await buttondownRequest<ButtondownSubscriber>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/subscribers',
      body: payload,
      headers,
    });

    return subscriber;
  },
});
