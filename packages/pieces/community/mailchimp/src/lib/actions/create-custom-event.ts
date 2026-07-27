import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const createCustomEvent = createAction({
  auth: mailchimpAuth,
  name: 'create_custom_event',
  displayName: 'Create Custom Event',
  description: 'Log a custom event for an existing subscriber, for use in automations and segmentation',
  audience: 'both',
  aiMetadata: { description: 'Records a named event (with optional properties) against an existing subscriber, identified by email, in an audience (list). Use to feed subscriber behavior into automations or segments. Not idempotent: each call logs a new, distinct event occurrence.', idempotent: false },
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to log the event for',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event (lowercase letters, numbers, and underscores only, e.g. "purchased_item")',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Optional key/value data to attach to the event',
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
