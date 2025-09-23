import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailchimpClient } from '../common/types';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const addSubscriberToTag = createAction({
  auth: mailchimpAuth,
  name: 'add_subscriber_to_tag',
  displayName: 'Add Subscriber to Tag',
  description: 'Add a subscriber to a specific tag in your Mailchimp audience.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to add to the tag',
      required: true,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to add the subscriber to',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email, tag_name } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    try {
      const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
      const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

      mailchimp.setConfig({
        accessToken: accessToken,
        server: serverPrefix,
      });

      const client = mailchimp as unknown as MailchimpClient;

      const result = await client.lists.updateListMemberTags(
        list_id as string,
        subscriberHash,
        {
          tags: [
            {
              name: tag_name,
              status: 'active',
            },
          ],
        }
      );

      return {
        success: true,
        message: `Successfully added subscriber ${email} to tag ${tag_name}`,
        data: result,
      };
    } catch (error: any) {
      console.error('Error adding subscriber to tag:', error);
      throw new Error(`Failed to add subscriber to tag: ${error.message}`);
    }
  },
});