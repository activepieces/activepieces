import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/tariffs/v2.0/{tariff}/set-tariff-display-information

export const tariffSetDisplayInformationAction = createAction({
  auth: ampecoAuth,
  name: 'tariffSetDisplayInformation',
  displayName: 'Actions - Tariffs - Set Display Information',
  description: 'Apply a Tariff Display Information to tariff.',
  props: {
        
  tariff: Property.Number({
    displayName: 'Tariff',
    required: true,
  }),

  defaultPriceInformation: Property.ShortText({
    displayName: 'Default Price Information',
    description: 'It could be set only for base tariff. The default information that would be shown on the display of the charge point without the user having authorized themselves. The default price information from the base tariff of the first EVSE would be used for the display, when the charge point has more than one EVSE.',
    required: false,
  }),

  defaultPriceInformationOffline: Property.ShortText({
    displayName: 'Default Price Information Offline',
    description: 'It could be set only for base tariff. The information that would be shown on the display of the charge point when offline.',
    required: false,
  }),

  priceInformation: Property.ShortText({
    displayName: 'Price Information',
    description: 'The information that would be shown on the display of the charge point for users that are eligible for this tariff.',
    required: false,
  }),

  totalCostInformation: Property.ShortText({
    displayName: 'Total Cost Information',
    description: 'Additional information that would be displayed on the charge point when the session ends, along with the total fees for energy, duration and idle.',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/tariffs/v2.0/{tariff}/set-tariff-display-information', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['defaultPriceInformation', 'defaultPriceInformationOffline', 'priceInformation', 'totalCostInformation']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
