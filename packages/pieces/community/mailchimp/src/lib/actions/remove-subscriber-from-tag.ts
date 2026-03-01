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
    list_id: mailchimpCommon.mailChimpListIdDropdown,
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
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.title || errorData.message || errorText;
          }
        } catch (parseError) {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            errorMessage = errorText;
          }
        }

        throw new Error(`Failed to remove subscriber from tag: ${errorMessage}`);
      }

      let result;
      try {
        const responseText = await response.text();
        if (responseText && responseText.trim()) {
          result = JSON.parse(responseText);
        } else {
          result = { success: true };
        }
      } catch (parseError) {
        result = { success: true };
      }

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
