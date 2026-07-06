import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createNewObject = createAction({
  auth: salesforceAuth,
  name: 'create_new_object',
  displayName: 'Create Object (Advanced)',
  description: 'Create new object',
  audience: 'both',
  aiMetadata: { description: 'Advanced variant of record creation: inserts a new Salesforce record for the given object API name from a JSON field map and returns the full raw HTTP response. Prefer Create Record for the common case where you only need the created record body; choose this when you need the complete API response envelope. Not idempotent: each call creates a new record, so re-running produces duplicates.', idempotent: false },
  props: {
    object: salesforcesCommon.object,
    data: Property.Json({
      displayName: 'Data',
      description: 'Select mapped object',
      required: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { data, object } = context.propsValue;
    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      `/services/data/v56.0/sobjects/${object}`,
      {
        ...data,
      }
    );
    return response;
  },
});
