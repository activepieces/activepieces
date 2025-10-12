import { createAction, Property } from '@activepieces/pieces-framework';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';


export const findFileAction = createAction({
  auth: servicenowAuth,
  name: 'find_file',
  displayName: 'Find File',
  description: 'Find a file (attachment) by filename',
  props: {
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The filename to search for',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'Optional: Filter by specific record ID',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const filename = context.propsValue.filename;
    const recordId = context.propsValue.recordId;
    const limit = context.propsValue.limit || 10;

    let query = `file_name=${encodeURIComponent(filename)}`;
    
    if (recordId) {
      query += `^table_sys_id=${recordId}`;
    }

    const response = await makeServiceNowRequest(
      context.auth,
      `/attachment?sysparm_query=${query}&sysparm_limit=${limit}&sysparm_exclude_reference_link=true`
    );

    return response.body.result || [];
  },
});