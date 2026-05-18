import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';
import crypto from 'crypto';

export const archiveSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'archive_subscriber',
  displayName: 'Archive Subscriber',
  description: 'Archive an existing audience member',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    subscriber_hash: Property.ShortText({
      displayName: 'Subscriber Hash or Email',
      description: 'MD5 hash of the lowercase email address, email address, or contact_id',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    
    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      let subscriberHash = context.propsValue.subscriber_hash;
      
      // If it looks like an email, convert to MD5 hash
      if (subscriberHash.includes('@')) {
        subscriberHash = crypto.createHash('md5').update(subscriberHash.toLowerCase()).digest('hex');
      }

      await client.lists.deleteListMember(context.propsValue.list_id!, subscriberHash);

      return {
        success: true,
        message: 'Subscriber archived successfully',
        list_id: context.propsValue.list_id,
        subscriber_hash: subscriberHash,
        archived_at: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'Subscriber not found',
          message: 'The subscriber could not be found in the specified list.',
          detail: error.detail || 'The requested resource could not be found',
        };
      }
      
      throw new Error(`Failed to archive subscriber: ${error.message || JSON.stringify(error)}`);
    }
  },
});
