import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const deleteRecord = createAction({
  auth: salesforceAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Deletes an existing record in a Salesforce object',
  props: {
    object: salesforcesCommon.object,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const { object, recordId } = context.propsValue;

    const response = await callSalesforceApi(
      HttpMethod.DELETE,
      context.auth,
      `/services/data/v56.0/sobjects/${object}/${recordId}`,
      undefined
    );
    return {
      success: true,
      object: object,
      recordId: recordId,
      status: response.status,
    };
  },
});

