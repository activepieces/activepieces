import { createAction, Property } from '@activepieces/pieces-framework';
import { ServiceNowRecordSchema } from '../common/types';
import {
  tableDropdown,
  recordDropdown,
  createServiceNowClient,
  servicenowAuth,
  resolveSysId,
} from '../common/props';
import { JOURNAL_ELEMENT } from '../common/journal';

export const addCommentAction = createAction({
  auth: servicenowAuth,
  name: 'add_comment',
  displayName: 'Add Comment or Work Note',
  description:
    'Append a customer-visible comment or an internal work note to a record (incident, request, problem, change, etc.)',
  props: {
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
    comment_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Customer-visible comment or internal work note',
      required: true,
      defaultValue: JOURNAL_ELEMENT.COMMENTS,
      options: {
        disabled: false,
        options: [
          { label: 'Customer-visible Comment', value: JOURNAL_ELEMENT.COMMENTS },
          { label: 'Internal Work Note', value: JOURNAL_ELEMENT.WORK_NOTES },
        ],
      },
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The text to append to the record',
      required: true,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id, comment_type, comment } =
      context.propsValue;
    const sysId = resolveSysId({ selected: record, manual: manual_sys_id });

    const client = createServiceNowClient(context.auth);
    const result = await client.updateRecord(table, sysId, {
      [comment_type]: comment,
    });

    return ServiceNowRecordSchema.parse(result);
  },
});
