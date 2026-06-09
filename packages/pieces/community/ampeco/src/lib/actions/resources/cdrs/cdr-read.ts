import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CdrReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/cdrs/v2.0/{cdr}

export const cdrReadAction = createAction({
  auth: ampecoAuth,
  name: 'cdrRead',
  displayName: 'Resources - Cdrs - Read',
  description: 'Get a CDR.',
  props: {
        
  cdr: Property.Number({
    displayName: 'Cdr',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
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
