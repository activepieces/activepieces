import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const removeSubscriberFromTag = createAction({
  auth: mailchimpAuth,
  name: 'remove_subscriber_from_tag',
  classification: 'WRITE',
  displayName: 'Remove Subscriber from Tag',
  description: 'Remove a subscriber from a specific tag in your Mailchimp audience',
  audience: 'both',
  aiMetadata: { description: 'Deactivates a tag on a subscriber, identified by email within a given audience (list). Use to un-segment or un-label a contact. Idempotent: removing a tag the member does not have leaves the state unchanged.', idempotent: true },
  propertyGroups: [
    {
      key: 'subscriber',
      display: 'section',
      label: 'Subscriber',
      icon: 'user',
      props: ['list_id', 'email'],
    },
    {
      key: 'tag',
      display: 'section',
      label: 'Tag',
      icon: 'tag',
      props: ['tag_name'],
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
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The tag to take off this subscriber.',
      placeholder: 'Customers',
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
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.title || errorData.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
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
