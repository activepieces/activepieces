import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableAddCommentToRecordAiAction = createAction({
  auth: airtableAuth,
  name: 'add_comment_to_record_ai',
  displayName: 'Add Comment to Record (Agent)',
  description: 'Post a comment on an Airtable record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a text comment on an existing record, optionally as a threaded reply to a parent comment ID. Mention users with @[userId] or @[userEmail] in the text. Requires a token with the data.recordComments:write scope. Not idempotent — each call adds a new comment.',
    idempotent: false,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id_or_name: Property.ShortText({
      displayName: 'Table ID or Name',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") or its exact name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description:
        'The record ID (e.g. "recXXXXXXXXXXXXXX") to comment on.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'The comment content. Mention a user with @[userId] or @[userEmail].',
      required: true,
    }),
    parent_comment_id: Property.ShortText({
      displayName: 'Parent Comment ID',
      description:
        'Optional ID of a parent comment to reply to (creates a threaded reply). Find IDs with List Record Comments (Agent).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_id, text, parent_comment_id } =
      propsValue;

    return await airtableCommon.addCommentToRecord({
      personalToken: auth.secret_text,
      baseId: base_id,
      tableId: table_id_or_name,
      recordId: record_id,
      text,
      parentCommentId: parent_comment_id,
    });
  },
});
