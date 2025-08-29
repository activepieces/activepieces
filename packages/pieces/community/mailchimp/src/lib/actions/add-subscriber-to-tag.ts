import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const addSubscriberToTag = createAction({
  auth: mailchimpAuth,
  name: 'add_subscriber_to_tag',
  displayName: 'Add Subscriber to Tag',
  description: 'Add a subscriber to a specific tag in your Mailchimp audience.',
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'The unique ID of the Mailchimp audience/list',
      required: true,
    }),
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
              status: 'active',
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

        throw new Error(`Failed to add subscriber to tag: ${errorMessage}`);
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
        message: `Successfully added subscriber ${email} to tag ${tag_name}`,
        data: result,
        _links: result._links || [],
      };
    } catch (error: any) {
      console.error('Error adding subscriber to tag:', error);
      throw new Error(`Failed to add subscriber to tag: ${error.message}`);
    }
  },
});
