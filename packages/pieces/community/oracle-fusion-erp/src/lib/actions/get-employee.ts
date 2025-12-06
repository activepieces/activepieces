import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oracleFusionErpAuth } from '../../index';
import { makeOracleApiCall } from '../common';
import { OracleFusionAuth } from '../auth';

export const getEmployeeAction = createAction({
  auth: oracleFusionErpAuth,
  name: 'get_employee',
  displayName: 'Get Employee',
  description: 'Retrieve employee information by Worker ID',
  props: {
    workerId: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The unique identifier for the worker',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OracleFusionAuth;
    const { workerId } = context.propsValue;

    return await makeOracleApiCall(
      auth,
      `/workers/${workerId}`,
      HttpMethod.GET,
      undefined,
      '/hcmRestApi/resources/latest'
    );
  },
});
