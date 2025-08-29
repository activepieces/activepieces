import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const removeSubscriberFromTag = createAction({
  auth: mailchimpAuth,
  name: 'remove_subscriber_from_tag',
  displayName: 'Remove Subscriber from Tag',
  description: 'Remove a subscriber from a specific tag in your Mailchimp audience.',
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'The unique ID of the Mailchimp audience/list',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to remove from the tag',
      required: true,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to remove the subscriber from',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email, tag_name } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    try {
      const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
      const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

      const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${list_id}/members/${subscriberHash}/tags`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [
            {
              name: tag_name,
              status: 'inactive',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to remove subscriber from tag: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Successfully removed subscriber ${email} from tag ${tag_name}`,
        data: result,
        _links: result._links || [],
      };
    } catch (error: any) {
      console.error('Error removing subscriber from tag:', error);
      throw new Error(`Failed to remove subscriber from tag: ${error.message}`);
    }
  },
});
