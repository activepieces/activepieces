import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PatchDowntimePeriodNoticeResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/downtime-period-notices/v1.0/{notice}

export const patchDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'patchDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Patch Downtime Period Notice',
  description: 'Update Downtime Period Notice.',
  props: {
        
  notice: Property.Number({
    displayName: 'Notice',
    description: '',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'downtime', value: 'downtime' },
      { label: 'exempt', value: 'exempt' }
      ],
    },
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<PatchDowntimePeriodNoticeResponse> {
    try {
      const url = processPathParameters('/public-api/resources/downtime-period-notices/v1.0/{notice}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['type', 'notice', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as PatchDowntimePeriodNoticeResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
