import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const addNoteToSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_note_to_subscriber',
  classification: 'WRITE',
  displayName: 'Add Note to Subscriber',
  description: 'Add a note to a subscriber in your Mailchimp audience',
  audience: 'both',
  aiMetadata: { description: 'Appends an internal note to a subscriber, identified by email within a given audience (list). Use to record context or annotations on a contact. Not idempotent: each call adds a new note even if the content is identical.', idempotent: false },
  propertyGroups: [
    {
      key: 'subscriber',
      display: 'section',
      label: 'Subscriber',
      icon: 'user',
      props: ['list_id', 'email'],
    },
    {
      key: 'note',
      display: 'section',
      label: 'Note',
      icon: 'text',
      props: ['note'],
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
    note: Property.LongText({
      displayName: 'Note',
      description: "Shown on the subscriber's profile in Mailchimp.",
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
