import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChangeFlexibilityAssetStatusResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const changeFlexibilityAssetStatusAction = createAction({
  auth: ampecoAuth,
  name: 'changeFlexibilityAssetStatus',
  displayName: 'Actions - Flexibility Asset - Change Flexibility Asset Status',
  description: 'Change the status of the Flexibility Asset. (Endpoint: POST /public-api/actions/flexibility-asset/v1.0/{flexibilityAsset}/change-status)',
  props: {
        
  flexibilityAsset: Property.ShortText({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  endsAt: Property.DateTime({
    displayName: 'Ends At',
    description: 'ISO 8601 formatted date. If an end date is set the asset will be automatically disabled at that time. Historical time series and forecasts are not generated after the end date.',
    required: false,
  }),
  },
  async run(context): Promise<ChangeFlexibilityAssetStatusResponse> {
    try {
      const url = processPathParameters('/public-api/actions/flexibility-asset/v1.0/{flexibilityAsset}/change-status', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['status', 'endsAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChangeFlexibilityAssetStatusResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
