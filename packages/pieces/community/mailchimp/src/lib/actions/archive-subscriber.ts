import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const archiveSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'archive_subscriber',
  displayName: 'Archive Subscriber',
  description: 'Archive a subscriber from a Mailchimp audience (list)',
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'The unique ID of the Mailchimp audience/list',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the subscriber to archive',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    try {
      const mailchimp = require('@mailchimp/mailchimp_marketing');
      mailchimp.setConfig({
        accessToken: accessToken,
        server: server,
      });

      const subscriberHash = mailchimpCommon.getMD5EmailHash(context.propsValue.email!);

      await mailchimp.lists.deleteListMember(context.propsValue.list_id!, subscriberHash);

      return {
        success: true,
        message: `Successfully archived subscriber ${context.propsValue.email}`,
        archived_email: context.propsValue.email,
        list_id: context.propsValue.list_id,
        archived_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error archiving subscriber:', error);
      throw new Error(`Failed to archive subscriber: ${error.message || JSON.stringify(error)}`);
    }
  },
});
