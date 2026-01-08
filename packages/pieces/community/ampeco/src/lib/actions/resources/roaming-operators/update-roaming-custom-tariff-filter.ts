import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdateRoamingCustomTariffFilterResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter}

export const updateRoamingCustomTariffFilterAction = createAction({
  auth: ampecoAuth,
  name: 'updateRoamingCustomTariffFilter',
  displayName: 'Resources - Roaming Operators - Update Roaming Custom Tariff Filter',
  description: 'Update an existing custom tariff filter.',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  customTariffFilter: Property.Number({
    displayName: 'Custom Tariff Filter',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: false,
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
    description: 'Array of current types (AC, DC) that this filter applies to',
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
    description: 'Position of the tariff filter in the ordering sequence. If an already existing order number is provided, it will reorder the other tariff filters to take their place in the sequence.',
    required: false,
  }),
  },
  async run(context): Promise<UpdateRoamingCustomTariffFilterResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'status', 'countryCode', 'applicableCurrentTypes', 'powerBelowKw', 'evseIdPrefix', 'order']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdateRoamingCustomTariffFilterResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
