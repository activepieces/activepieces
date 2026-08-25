import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PostDowntimePeriodNoticeResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/downtime-period-notices/v1.0

export const postDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'postDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Post Downtime Period Notice',
  description: 'Create Downtime Period Notice.',
  audience: 'both',
  aiMetadata: { description: 'Create a new downtime period notice of a given type (downtime or exempt) with a notice value and optional description. Use to register a new notice; to change an existing one use the patch action. Not idempotent — each call creates a new notice.', idempotent: false },
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
