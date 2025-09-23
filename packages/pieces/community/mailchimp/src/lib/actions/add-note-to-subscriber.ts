import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const addNoteToSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_note_to_subscriber',
  displayName: 'Add Note to Subscriber',
  description: 'Add a note to a subscriber in your Mailchimp audience.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to add a note to',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note Content',
      description: 'The note content to add to the subscriber',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email, note } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    try {
      const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
      const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

      const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${list_id}/members/${subscriberHash}/notes`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note,
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

        throw new Error(`Failed to add note to subscriber: ${errorMessage}`);
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
        message: `Successfully added note to subscriber ${email}`,
        note_id: result.id,
        note_content: result.note,
        created_at: result.created_at,
        _links: result._links || [],
      };
    } catch (error: any) {
      console.error('Error adding note to subscriber:', error);
      throw new Error(`Failed to add note to subscriber: ${error.message}`);
    }
  },
});
