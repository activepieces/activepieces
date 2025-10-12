import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';

export const attachFileAction = createAction({
  auth: servicenowAuth,
  name: 'attach_file',
  displayName: 'Attach File to Record',
  description: 'Upload a file and attach it to a record in ServiceNow',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table containing the record (e.g., incident)',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'The sys_id of the record to attach file to',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach',
      required: true,
    }),
  },

  async run(context) {
    const { table, recordId, file } = context.propsValue;

    const formData = new FormData();
    formData.append('table_name', table);
    formData.append('table_sys_id', recordId);
    formData.append('file', file.data, {
      filename: file.filename,
    });

    const response = await makeServiceNowRequest(
      context.auth,
      `/attachment/file`,
      HttpMethod.POST,
      formData,
      true
    );

    return response.body.result;
  },
});
