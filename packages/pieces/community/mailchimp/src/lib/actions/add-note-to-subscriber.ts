import { mailchimpOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpApi } from '../common/client';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const addNoteToSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_note_to_subscriber',
  classification: 'WRITE',
  displayName: 'Add Note to Subscriber',
  description: 'Add a note to a subscriber in your Mailchimp audience.',
  audience: 'both',
  aiMetadata: { description: 'Appends an internal note to a subscriber, identified by email within a given audience (list). Use to record context or annotations on a contact. Not idempotent: each call adds a new note even if the content is identical.', idempotent: false },
  outputSchema: mailchimpOutputSchemas['addNote'],
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
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const result = await client.request<NoteResponse>({
      method: HttpMethod.POST,
      path: `${mailchimpApi.memberPath({ listId: list_id, email })}/notes`,
      body: { note },
      operation: 'add note to subscriber',
    });
    return {
      success: true,
      message: `Successfully added note to subscriber ${email}`,
      note_id: result.id ?? null,
      note_content: result.note ?? note,
      created_at: result.created_at ?? null,
    };
  },
});

type NoteResponse = { id?: number; note?: string; created_at?: string };
