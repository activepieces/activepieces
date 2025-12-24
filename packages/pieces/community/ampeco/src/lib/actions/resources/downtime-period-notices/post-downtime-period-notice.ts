import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PostDowntimePeriodNoticeResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const postDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'postDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Post Downtime Period Notice',
  description: 'Create Downtime Period Notice. (Endpoint: POST /public-api/resources/downtime-period-notices/v1.0)',
  props: {
        
  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'downtime', value: 'downtime' },
      { label: 'exempt', value: 'exempt' }
      ],
    },
  }),

  notice: Property.ShortText({
    displayName: 'Notice',
    description: '',
    required: true,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<PostDowntimePeriodNoticeResponse> {
    try {
      const url = processPathParameters('/public-api/resources/downtime-period-notices/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['type', 'notice', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PostDowntimePeriodNoticeResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
