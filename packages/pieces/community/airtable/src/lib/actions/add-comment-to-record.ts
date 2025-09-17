import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableAddCommentToRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_add_comment_to_record',
  displayName: 'Add Comment to Record',
  description: 'Adds a comment to an existing record.',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'The content of the comment. You can mention users with @[userId] or @[userEmail].',
      required: true,
    }),
    parentCommentId: Property.ShortText({
      displayName: 'Parent Comment ID',
      description:
        'The ID of the parent comment, if this comment is a threaded reply.',
      required: false,
    }),
  },
  async run(context) {
    const personalToken = context.auth;
    const {
      base: baseId,
      tableId,
      recordId,
      text,
      parentCommentId,
    } = context.propsValue;

    return await airtableCommon.createComment({
      personalToken,
      baseId,
      tableId: tableId as string,
      recordId: recordId as string,
      text: text,
      parentCommentId: parentCommentId,
    });
  },
});
