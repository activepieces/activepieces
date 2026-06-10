import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SessionReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/sessions/v1.0/{session})

export const sessionReadAction = createAction({
  auth: ampecoAuth,
  name: 'sessionRead',
  displayName: 'Resources - Sessions - Read',
  description: 'Session / Read.',
  props: {
        
  session: Property.ShortText({
    displayName: 'Session',
    description: '',
    required: true,
  }),

  withClockAlignedEnergyConsumption: Property.StaticDropdown({
    displayName: 'With Clock Aligned Energy Consumption',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  clockAlignedInterval: Property.StaticDropdown({
    displayName: 'Clock Aligned Interval',
    description: '',
    required: false,
    options: {
      options: [
      { label: '15', value: '15' },
      { label: '30', value: '30' },
      { label: '60', value: '60' }
      ],
    },
  }),

  withAuthorization: Property.StaticDropdown({
    displayName: 'With Authorization',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withChargingPeriods: Property.StaticDropdown({
    displayName: 'With Charging Periods',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withChargingPeriodsPriceBreakdown: Property.StaticDropdown({
    displayName: 'With Charging Periods Price Breakdown',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withPriceBreakdown: Property.StaticDropdown({
    displayName: 'With Price Breakdown',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
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
  async run(context): Promise<SessionReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/sessions/v1.0/{session}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['withClockAlignedEnergyConsumption', 'clockAlignedInterval', 'withAuthorization', 'withChargingPeriods', 'withChargingPeriodsPriceBreakdown', 'withPriceBreakdown', 'include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SessionReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
