import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createNewObject = createAction({
  auth: salesforceAuth,
  name: 'create_new_object',
  displayName: 'Create Object (Advanced)',
  description: 'Create new object',
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
