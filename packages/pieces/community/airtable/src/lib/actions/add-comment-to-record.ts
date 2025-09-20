import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableAddCommentAction = createAction({
  auth: airtableAuth,
  name: 'airtable_add_comment',
  displayName: 'Add Comment to Record',
  description: 'Adds a comment to an existing Airtable record',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    commentText: Property.LongText({
      displayName: 'Comment Text',
      required: true,
    }),
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { base: baseId, tableId, recordId, commentText } =
      context.propsValue;

    return airtableCommon.addCommentToRecord({
      personalToken,
      baseId,
      tableId: tableId as string,
      recordId: recordId as string,
      commentText,
    });
  },
});
