import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CdrReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const cdrReadAction = createAction({
  auth: ampecoAuth,
  name: 'cdrRead',
  displayName: 'Resources - Cdrs - Cdr Read',
  description: 'Get a CDR. (Endpoint: GET /public-api/resources/cdrs/v2.0/{cdr})',
  props: {
        
  cdr: Property.Number({
    displayName: 'Cdr',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
  }),
  },
  async run(context): Promise<CdrReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/cdrs/v2.0/{cdr}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CdrReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
