import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableAddCommentToRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_add_comment_to_record',
  displayName: 'Add Comment to Record',
  description: 'Adds a comment to an existing record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a text comment on an existing record, optionally as a threaded reply to a parent comment ID. Use to leave a note on a record; mention users with @[userId] or @[userEmail] in the text. Not idempotent — each call adds a new comment.',
    idempotent: false,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId, 
    text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'The content of the comment. To mention a user, use the format `@[userId]` or `@[userEmail]`.',
      required: true,
    }),
    parentCommentId: Property.ShortText({
      displayName: 'Parent Comment ID',
      description:
        'Optional. The ID of a parent comment to create a threaded reply.',
      required: false,
    }),
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableId, recordId, text, parentCommentId } =
      propsValue;

    return await airtableCommon.addCommentToRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      text: text,
      parentCommentId: parentCommentId,
    });
  },
});