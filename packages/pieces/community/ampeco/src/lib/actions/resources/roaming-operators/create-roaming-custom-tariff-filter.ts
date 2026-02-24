import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreateRoamingCustomTariffFilterResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters

export const createRoamingCustomTariffFilterAction = createAction({
  auth: ampecoAuth,
  name: 'createRoamingCustomTariffFilter',
  displayName: 'Resources - Roaming Operators - Create Roaming Custom Tariff Filter',
  description: 'Create new custom tariff filter for a roaming operator.',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
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

  countryCode: Property.ShortText({
    displayName: 'Country Code',
    description: 'ISO 3166-1 alpha-2 country code',
    required: false,
  }),

  applicableCurrentTypes: Property.StaticMultiSelectDropdown({
    displayName: 'Applicable Current Types',
    description: 'Array of current types (AC, DC) that this filter applies to, pass an empty array to clear all current type restrictions.',
    required: false,
    options: {
      options: [
      { label: 'AC', value: 'AC' },
      { label: 'DC', value: 'DC' }
      ],
    },
  }),

  powerBelowKw: Property.Number({
    displayName: 'Power Below Kw',
    description: 'Filter EVSEs with power below specified kW value',
    required: false,
  }),

  evseIdPrefix: Property.ShortText({
    displayName: 'Evse Id Prefix',
    description: 'Filter EVSEs whose IDs start with specified prefix(es). Multiple prefixes separated by newlines',
    required: false,
  }),

  order: Property.Number({
    displayName: 'Order',
    description: 'Position of the tariff filter in the ordering sequence. When not provided during creation, it will go last. If an already existing order number is provided, it will reorder the other tariff filters to take their place in the sequence.',
    required: false,
  }),
  },
  async run(context): Promise<CreateRoamingCustomTariffFilterResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'status', 'countryCode', 'applicableCurrentTypes', 'powerBelowKw', 'evseIdPrefix', 'order']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateRoamingCustomTariffFilterResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
