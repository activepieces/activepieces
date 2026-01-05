import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

//  Endpoint: POST /public-api/actions/roaming-operator/v2.0/{roamingOperator}/custom-tariff-filter/{customTariffFilter}/set-pricing-data
export const updateCustomTariffFilterTariffAction = createAction({
  auth: ampecoAuth,
  name: 'updateCustomTariffFilterTariff',
  displayName: 'Actions - Roaming Operator - Update Custom Tariff Filter Tariff',
  description: 'Set the pricing data for a custom tariff filter. This action will update the underling roaming tariff and create a pricing based on it. The pricing can then be utilized by attaching a markup tariff to the tariff map of the custom tariff filter.',
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

  country_code: Property.ShortText({
    displayName: 'Country Code',
    description: 'ISO-3166 alpha-2 country code of the CPO that owns this Tariff.',
    required: false,
  }),

  party_id: Property.ShortText({
    displayName: 'Party Id',
    description: 'ID of the CPO that owns this Tariff (following the ISO-15118 standard).',
    required: false,
  }),

  id: Property.ShortText({
    displayName: 'Id',
    description: 'Uniquely identifies the tariff within the CPO\'s platform.',
    required: true,
  }),

  currency: Property.ShortText({
    displayName: 'Currency',
    description: 'ISO 4217 code of the currency of this tariff.',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: 'Type of this tariff.',
    required: false,
    options: {
      options: [
      { label: 'AD_HOC_PAYMENT', value: 'AD_HOC_PAYMENT' },
      { label: 'PROFILE_CHEAP', value: 'PROFILE_CHEAP' },
      { label: 'PROFILE_FAST', value: 'PROFILE_FAST' },
      { label: 'PROFILE_GREEN', value: 'PROFILE_GREEN' },
      { label: 'REGULAR', value: 'REGULAR' }
      ],
    },
  }),

  tariff_alt_text: Property.Array({
    displayName: 'Tariff Alt Text',
    description: 'List of multi-language alternative texts for this tariff.',
    required: false,
    properties: { 
         
  language: Property.ShortText({
    displayName: 'Language',
    description: 'Language Code ISO 639-1.',
    required: true,
  }),

  text: Property.ShortText({
    displayName: 'Text',
    description: 'Alternative tariff text in this language.',
    required: true,
  }), 
    },
  }),

  tariff_alt_url: Property.ShortText({
    displayName: 'Tariff Alt Url',
    description: 'URL to a web page that contains an explanation of the tariff information.',
    required: false,
  }),

  min_price__excl_vat: Property.Number({
    displayName: 'Min Price - Excl Vat',
    description: 'Price excluding VAT.',
    required: false,
  }),

  min_price__incl_vat: Property.Number({
    displayName: 'Min Price - Incl Vat',
    description: 'Price including VAT.',
    required: false,
  }),

  max_price__excl_vat: Property.Number({
    displayName: 'Max Price - Excl Vat',
    description: 'Price excluding VAT.',
    required: false,
  }),

  max_price__incl_vat: Property.Number({
    displayName: 'Max Price - Incl Vat',
    description: 'Price including VAT.',
    required: false,
  }),

  elements: Property.Array({
    displayName: 'Elements',
    description: 'List of Tariff Elements.',
    required: true,
    properties: { 
         
  price_components: Property.Json({
    displayName: 'Price Components',
    description: `List of price components that describe the pricing of this tariff element.`,
    required: true,
    defaultValue:{
  "type": "array",
  "minItems": 1,
  "description": "List of price components that describe the pricing of this tariff element.",
  "items": {
    "type": "object",
    "required": [
      "type",
      "price",
      "step_size"
    ],
    "properties": {
      "type": {
        "type": "string",
        "enum": [
          "ENERGY",
          "FLAT",
          "PARKING_TIME",
          "TIME"
        ],
        "description": "Type of tariff dimension."
      },
      "price": {
        "type": "number",
        "format": "float",
        "minimum": 0,
        "description": "Price per unit (excluding VAT) for this tariff dimension.",
        "example": 0.25
      },
      "vat": {
        "type": "number",
        "format": "float",
        "minimum": 0,
        "maximum": 100,
        "description": "Applicable VAT percentage for this tariff dimension. If omitted, no VAT is applicable.",
        "example": 21
      },
      "step_size": {
        "type": "integer",
        "minimum": 1,
        "description": "Minimum amount to be billed. This unit will be billed in this step_size.",
        "example": 1
      }
    }
  }
}
  }),

  restrictions__start_time: Property.ShortText({
    displayName: 'Restrictions - Start Time',
    description: 'Start time of day in local time, the time zone is defined in the location.',
    required: false,
  }),

  restrictions__end_time: Property.ShortText({
    displayName: 'Restrictions - End Time',
    description: 'End time of day in local time, the time zone is defined in the location.',
    required: false,
  }),

  restrictions__start_date: Property.DateTime({
    displayName: 'Restrictions - Start Date',
    description: 'Start date in local time, the time zone is defined in the location.',
    required: false,
  }),

  restrictions__end_date: Property.DateTime({
    displayName: 'Restrictions - End Date',
    description: 'End date in local time, the time zone is defined in the location.',
    required: false,
  }),

  restrictions__min_kwh: Property.Number({
    displayName: 'Restrictions - Min Kwh',
    description: 'Minimum consumed energy in kWh.',
    required: false,
  }),

  restrictions__max_kwh: Property.Number({
    displayName: 'Restrictions - Max Kwh',
    description: 'Maximum consumed energy in kWh.',
    required: false,
  }),

  restrictions__min_current: Property.Number({
    displayName: 'Restrictions - Min Current',
    description: 'Sum of the minimum current (in Amperes) over all phases.',
    required: false,
  }),

  restrictions__max_current: Property.Number({
    displayName: 'Restrictions - Max Current',
    description: 'Sum of the maximum current (in Amperes) over all phases.',
    required: false,
  }),

  restrictions__min_power: Property.Number({
    displayName: 'Restrictions - Min Power',
    description: 'Minimum power in kW.',
    required: false,
  }),

  restrictions__max_power: Property.Number({
    displayName: 'Restrictions - Max Power',
    description: 'Maximum power in kW.',
    required: false,
  }),

  restrictions__min_duration: Property.Number({
    displayName: 'Restrictions - Min Duration',
    description: 'Minimum duration in seconds.',
    required: false,
  }),

  restrictions__max_duration: Property.Number({
    displayName: 'Restrictions - Max Duration',
    description: 'Maximum duration in seconds.',
    required: false,
  }),

  restrictions__day_of_week: Property.StaticMultiSelectDropdown({
    displayName: 'Restrictions - Day Of Week',
    description: 'Which day(s) of the week this tariff element is active.',
    required: false,
    options: {
      options: [
      { label: 'MONDAY', value: 'MONDAY' },
      { label: 'TUESDAY', value: 'TUESDAY' },
      { label: 'WEDNESDAY', value: 'WEDNESDAY' },
      { label: 'THURSDAY', value: 'THURSDAY' },
      { label: 'FRIDAY', value: 'FRIDAY' },
      { label: 'SATURDAY', value: 'SATURDAY' },
      { label: 'SUNDAY', value: 'SUNDAY' }
      ],
    },
  }),

  restrictions__reservation: Property.StaticDropdown({
    displayName: 'Restrictions - Reservation',
    description: 'When this restriction is present, the tariff element applies to a reservation.',
    required: false,
    options: {
      options: [
      { label: 'RESERVATION', value: 'RESERVATION' },
      { label: 'RESERVATION_EXPIRES', value: 'RESERVATION_EXPIRES' }
      ],
    },
  }), 
    },
  }),

  start_date_time: Property.DateTime({
    displayName: 'Start Date Time',
    description: 'The time when this tariff becomes active. Format ISO 8601 UTC.',
    required: false,
  }),

  end_date_time: Property.DateTime({
    displayName: 'End Date Time',
    description: 'The time after which this tariff is no longer valid. Format ISO 8601 UTC.',
    required: false,
  }),

  energy_mix__is_green_energy: Property.StaticDropdown({
    displayName: 'Energy Mix - Is Green Energy',
    description: 'True if 100% from regenerative sources.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  energy_mix__energy_sources: Property.Array({
    displayName: 'Energy Mix - Energy Sources',
    description: 'Energy sources of this energy mix.',
    required: false,
    properties: { 
         
  source: Property.StaticDropdown({
    displayName: 'Source',
    description: 'Type of energy source.',
    required: true,
    options: {
      options: [
      { label: 'NUCLEAR', value: 'NUCLEAR' },
      { label: 'GENERAL_FOSSIL', value: 'GENERAL_FOSSIL' },
      { label: 'COAL', value: 'COAL' },
      { label: 'GAS', value: 'GAS' },
      { label: 'GENERAL_GREEN', value: 'GENERAL_GREEN' },
      { label: 'SOLAR', value: 'SOLAR' },
      { label: 'WIND', value: 'WIND' },
      { label: 'WATER', value: 'WATER' }
      ],
    },
  }),

  percentage: Property.Number({
    displayName: 'Percentage',
    description: 'Percentage of this source in the mix.',
    required: true,
  }), 
    },
  }),

  energy_mix__environ_impact: Property.Array({
    displayName: 'Energy Mix - Environ Impact',
    description: 'Environmental impact of this energy mix.',
    required: false,
    properties: { 
         
  category: Property.StaticDropdown({
    displayName: 'Category',
    description: 'Environmental impact category.',
    required: true,
    options: {
      options: [
      { label: 'NUCLEAR_WASTE', value: 'NUCLEAR_WASTE' },
      { label: 'CARBON_DIOXIDE', value: 'CARBON_DIOXIDE' }
      ],
    },
  }),

  amount: Property.Number({
    displayName: 'Amount',
    description: 'Amount of this impact in g/kWh.',
    required: true,
  }), 
    },
  }),

  energy_mix__supplier_name: Property.ShortText({
    displayName: 'Energy Mix - Supplier Name',
    description: 'Name of the energy supplier.',
    required: false,
  }),

  energy_mix__energy_product_name: Property.ShortText({
    displayName: 'Energy Mix - Energy Product Name',
    description: 'Name of the energy product.',
    required: false,
  }),

  last_updated: Property.DateTime({
    displayName: 'Last Updated',
    description: 'Timestamp when this Tariff was last updated. Format ISO 8601 UTC.',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/roaming-operator/v2.0/{roamingOperator}/custom-tariff-filter/{customTariffFilter}/set-pricing-data', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['country_code', 'party_id', 'id', 'currency', 'type', 'tariff_alt_text', 'tariff_alt_url', 'min_price', 'max_price', 'elements', 'start_date_time', 'end_date_time', 'energy_mix', 'last_updated']
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
