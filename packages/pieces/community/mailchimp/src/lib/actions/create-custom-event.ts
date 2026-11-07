import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const createCustomEvent = createAction({
  auth: mailchimpAuth,
  name: 'create_custom_event',
  classification: 'WRITE',
  displayName: 'Create Custom Event',
  description: 'Log an event for a subscriber, for automations and segments',
  audience: 'both',
  aiMetadata: { description: 'Records a named event (with optional properties) against an existing subscriber, identified by email, in an audience (list). Use to feed subscriber behavior into automations or segments. Not idempotent: each call logs a new, distinct event occurrence.', idempotent: false },
  propertyGroups: [
    {
      key: 'subscriber',
      display: 'section',
      label: 'Subscriber',
      icon: 'user',
      props: ['list_id', 'email'],
    },
    {
      key: 'event',
      display: 'section',
      label: 'Event',
      icon: 'tag',
      props: ['name', 'properties'],
    },
  ],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Must already be in the audience.',
      placeholder: 'jane@example.com',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'Lowercase letters, numbers and underscores only.',
      placeholder: 'purchased_item',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Extra data saved with the event.',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, email, name, properties } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      // Docs: https://mailchimp.com/developer/marketing/api/list-member-events/add-event/
      await client.lists.createListMemberEvent(list_id as string, subscriberHash, {
        name,
        ...(properties ? { properties } : {}),
      });

      return {
        success: true,
        message: `Successfully created event "${name}" for ${email}`,
        list_id,
        email,
        name,
      };
    } catch (error: any) {
      throw new Error(`Failed to create custom event: ${error.message || JSON.stringify(error)}`);
    }
  },
});
