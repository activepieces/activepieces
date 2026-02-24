import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters,
} from '../../../common/utils';
import { TariffCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/tariffs/v1.0

export const tariffCreateAction = createAction({
  auth: ampecoAuth,
  name: 'tariffCreate',
  displayName: 'Resources - Tariffs - Create',
  description: 'Create new tariff.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: '',
      required: true,
    }),

    type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Setting the type to `charging not allowed` or `free` is enough for creating the particular type of tariff',
      required: true,
      options: {
        options: [
          { label: 'free', value: 'free' },
          { label: 'flat rate', value: 'flat rate' },
          { label: 'duration+energy', value: 'duration+energy' },
          {
            label: 'duration+energy time of day',
            value: 'duration+energy time of day',
          },
          { label: 'energy tou', value: 'energy tou' },
          { label: 'standard', value: 'standard' },
          { label: 'charging not allowed', value: 'charging not allowed' },
          { label: 'average power levels', value: 'average power levels' },
          { label: 'peak power levels', value: 'peak power levels' },
          { label: 'standard_tod', value: 'standard_tod' },
          {
            label: 'optimised dynamic pricing',
            value: 'optimised dynamic pricing',
          },
        ],
      },
    }),

    dayTariffStart: Property.ShortText({
      displayName: 'Day Tariff Start',
      description: 'A time when the day begins',
      required: false,
    }),

    nightTariffStart: Property.ShortText({
      displayName: 'Night Tariff Start',
      description: 'A time when the night begins',
      required: false,
    }),

    pricing__pricePerSession: Property.Number({
      displayName: 'Pricing - Price Per Session',
      description:
        'Price per session. Only applicable with flat rate tariffs. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__connectionFee: Property.Number({
      displayName: 'Pricing - Connection Fee',
      description:
        'Connection fee. A fixed fee that is applied at the start of the charging session. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__pricePerKwh: Property.Number({
      displayName: 'Pricing - Price Per Kwh',
      description:
        'Price per kWh. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__dayPricePerKwh: Property.Number({
      displayName: 'Pricing - Day Price Per Kwh',
      description:
        'Price per kWh during the day. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__nightPricePerKwh: Property.Number({
      displayName: 'Pricing - Night Price Per Kwh',
      description:
        'Price per kWh during the night. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__pricePeriodInMinutes: Property.StaticDropdown({
      displayName: 'Pricing - Price Period In Minutes',
      description:
        'Charging period. In minutes. It defines the time-period for charging a fee.',
      required: false,
      options: {
        options: [
          { label: '1', value: '1' },
          { label: '15', value: '15' },
          { label: '30', value: '30' },
          { label: '60', value: '60' },
          { label: '240', value: '240' },
          { label: '360', value: '360' },
        ],
      },
    }),

    pricing__pricePerPeriod: Property.Number({
      displayName: 'Pricing - Price Per Period',
      description:
        'Charging fee per period. Applicable for duration+energy. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__durationFeeLimit: Property.Number({
      displayName: 'Pricing - Duration Fee Limit',
      description:
        'Duration fee limit for the whole session if fee is applied.',
      required: false,
    }),

    pricing__dayPricePerPeriod: Property.Number({
      displayName: 'Pricing - Day Price Per Period',
      description:
        'Charging fee per period during the day. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__nightPricePerPeriod: Property.Number({
      displayName: 'Pricing - Night Price Per Period',
      description:
        'Charging fee per period during the night. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__dayIdleFeePerMinute: Property.Number({
      displayName: 'Pricing - Day Idle Fee Per Minute',
      description:
        'Charging fee per minute during the day. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__nightIdleFeePerMinute: Property.Number({
      displayName: 'Pricing - Night Idle Fee Per Minute',
      description:
        'Charging fee per minute during the night. Applicable for duration+energy time of day. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__idleFeePerMinute: Property.Number({
      displayName: 'Pricing - Idle Fee Per Minute',
      description:
        'Idle fee per minute. A fee per minute that is applied during idle period (no charging). Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__idleFeeGracePeriodMinutes: Property.Number({
      displayName: 'Pricing - Idle Fee Grace Period Minutes',
      description:
        'Idle fee grace period (min). Optional. When idle period (no charging) is detected during a session the user is given this grace period to remove the vehicle, before idle fee starts applying.',
      required: false,
    }),

    pricing__idlePricingPeriodInMinutes: Property.StaticDropdown({
      displayName: 'Pricing - Idle Pricing Period In Minutes',
      description:
        'Idle fee per minute. A fee per minute that is applied during idle period (no charging).',
      required: false,
      options: {
        options: [
          { label: '1', value: '1' },
          { label: '15', value: '15' },
          { label: '30', value: '30' },
          { label: '60', value: '60' },
          { label: '240', value: '240' },
          { label: '360', value: '360' },
        ],
      },
    }),

    pricing__idleFeePeriodStart: Property.ShortText({
      displayName: 'Pricing - Idle Fee Period Start',
      description: 'Defined start time for the application of idle fee.',
      required: false,
    }),

    pricing__idleFeePeriodEnd: Property.ShortText({
      displayName: 'Pricing - Idle Fee Period End',
      description: 'Defined end time for the application of idle fee.',
      required: false,
    }),

    pricing__idleFeeLimit: Property.Number({
      displayName: 'Pricing - Idle Fee Limit',
      description: 'Idle fee limit for the whole session if fee is applied.',
      required: false,
    }),

    pricing__connectionFeeMinimumSessionDuration: Property.Number({
      displayName: 'Pricing - Connection Fee Minimum Session Duration',
      description: 'Connection Fee Minimum Session Duration (min). Optional.',
      required: false,
    }),

    pricing__connectionFeeMinimumSessionEnergy: Property.Number({
      displayName: 'Pricing - Connection Fee Minimum Session Energy',
      description:
        'Connection Fee Minimum Session Energy (kWh). Optional. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__durationFeeGracePeriod: Property.Number({
      displayName: 'Pricing - Duration Fee Grace Period',
      description: 'Duration Fee Grace Period (min). Optional.',
      required: false,
    }),

    pricing__minPrice: Property.Number({
      displayName: 'Pricing - Min Price',
      description: 'Min. price. Sets a minimum total amount per session.',
      required: false,
    }),

    pricing__preAuthorizeAmount: Property.Number({
      displayName: 'Pricing - Pre Authorize Amount',
      description:
        'Pre-authorize amount. The amount to pre-authorize before starting a session. Up to 5 digits after the decimal point depending on the currency precision.',
      required: false,
    }),

    pricing__taxID: Property.Number({
      displayName: 'Pricing - Tax I D',
      description:
        'If Multi-tax Support has been enabled in the Ampeco.CHARGE settings, you can provide the taxId for the tariff here.',
      required: false,
    }),

    pricing__chargePointElectricityRate: Property.StaticDropdown({
      displayName: 'Pricing - Charge Point Electricity Rate',
      description:
        'Use the Electricity Rate of the Charge Point that is already attached and aims to track the electricity costs.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    pricing__fallbackElectricityRateId: Property.Number({
      displayName: 'Pricing - Fallback Electricity Rate Id',
      description:
        'When ChargePointElectricityRate is set to *false*, the Electricity Rate ID MUST be supplied in order the electricity rates for the tariff to be known.',
      required: false,
    }),

    pricing__markupPercentagePerKwh: Property.Number({
      displayName: 'Pricing - Markup Percentage Per Kwh',
      description: '',
      required: false,
    }),

    pricing__markupFixedFeePerKwh: Property.Number({
      displayName: 'Pricing - Markup Fixed Fee Per Kwh',
      description: '',
      required: false,
    }),

    pricing__flexibleMarkUpAsFixedPerKwh__defaultPrice: Property.Number({
      displayName:
        'Pricing - Flexible Mark Up As Fixed Per Kwh - Default Price',
      description:
        'Set price for the intervals not specified in `intervalPricing` field.',
      required: false,
    }),

    pricing__flexibleMarkUpAsFixedPerKwh__intervalPricing: Property.Array({
      displayName:
        'Pricing - Flexible Mark Up As Fixed Per Kwh - Interval Pricing',
      description:
        'The time interval must be always the same and should not exceed the 24-hour mark. It could be either 15 min, 30 min or 60 min. The startAt and endAt must comply with this restriction.',
      required: false,
      properties: {
        startsAt: Property.ShortText({
          displayName: 'Starts At',
          description:
            'The start time of the period. Formatted as hours:minutes. Should be provided in the local time zone and not in UTC.',
          required: true,
        }),

        endsAt: Property.ShortText({
          displayName: 'Ends At',
          description:
            'The end time of the period. Formatted as hours:minutes. Should be provided in the local time zone and not in UTC.',
          required: true,
        }),

        price: Property.Number({
          displayName: 'Price',
          description:
            'The price that will apply for the given price period. Must include tax.',
          required: true,
        }),
      },
    }),

    pricing__multiPricePerKwh: Property.Array({
      displayName: 'Pricing - Multi Price Per Kwh',
      description:
        'Create the price levels according to the kWh. <br /> The first level must have zero value for **firstKwh**. <br /> The last level must have an infinity value for **lastKwh**.',
      required: false,
      properties: {
        firstKwh: Property.Number({
          displayName: 'First Kwh',
          description: '',
          required: true,
        }),

        lastKwh: Property.Number({
          displayName: 'Last Kwh',
          description: '',
          required: false,
        }),

        feePerKwh: Property.Number({
          displayName: 'Fee Per Kwh',
          description: '',
          required: false,
        }),

        flatFee: Property.Number({
          displayName: 'Flat Fee',
          description: '',
          required: false,
        }),
      },
    }),

    pricing__multiPricePerDuration: Property.Array({
      displayName: 'Pricing - Multi Price Per Duration',
      description:
        'Create the price levels according to the duration of the session from the time the charging started. <br /> The first level must have zero value for **firstUnit**. <br /> The last level must have an infinity value for **lastUnit**.',
      required: false,
      properties: {
        firstUnit: Property.Number({
          displayName: 'First Unit',
          description: '',
          required: true,
        }),

        lastUnit: Property.Number({
          displayName: 'Last Unit',
          description: '',
          required: false,
        }),

        feePerUnit: Property.Number({
          displayName: 'Fee Per Unit',
          description: '',
          required: false,
        }),

        flatFee: Property.Number({
          displayName: 'Flat Fee',
          description: '',
          required: false,
        }),
      },
    }),

    pricing__multiIdleFee: Property.Array({
      displayName: 'Pricing - Multi Idle Fee',
      description:
        'Different price levels could be created depending on the duration of the idle period. <br /> The first level must have zero value for **firstUnit**. <br /> The last level must have an infinity value for **lastUnit**.',
      required: false,
      properties: {
        firstUnit: Property.Number({
          displayName: 'First Unit',
          description: '',
          required: true,
        }),

        lastUnit: Property.Number({
          displayName: 'Last Unit',
          description: '',
          required: false,
        }),

        feePerUnit: Property.Number({
          displayName: 'Fee Per Unit',
          description: '',
          required: false,
        }),

        flatFee: Property.Number({
          displayName: 'Flat Fee',
          description: '',
          required: false,
        }),
      },
    }),

    pricing__regularUsePeriod: Property.Number({
      displayName: 'Pricing - Regular Use Period',
      description: 'In minutes. Only for the Peak power level tariff.',
      required: false,
    }),

    pricing__averagePowerLevels: Property.Array({
      displayName: 'Pricing - Average Power Levels',
      description: '',
      required: false,
      properties: {
        averagePowerUpToKw: Property.Number({
          displayName: 'Average Power Up To Kw',
          description: '',
          required: true,
        }),

        pricePerMinute: Property.Number({
          displayName: 'Price Per Minute',
          description: '',
          required: true,
        }),
      },
    }),

    pricing__peakPowerLevels: Property.Array({
      displayName: 'Pricing - Peak Power Levels',
      description: '',
      required: false,
      properties: {
        peakPowerUpToKw: Property.Number({
          displayName: 'Peak Power Up To Kw',
          description: '',
          required: true,
        }),

        regularPricePerMinute: Property.Number({
          displayName: 'Regular Price Per Minute',
          description: '',
          required: true,
        }),

        excessUsePricePerMin: Property.Number({
          displayName: 'Excess Use Price Per Min',
          description: '',
          required: true,
        }),
      },
    }),

    pricing__timePeriods: Property.Array({
      displayName: 'Pricing - Time Periods',
      description: '',
      required: false,
      properties: {
        startTime: Property.ShortText({
          displayName: 'Start Time',
          description: 'The 24-hour format should be used.',
          required: true,
        }),

        endTime: Property.ShortText({
          displayName: 'End Time',
          description: 'The 24-hour format should be used.',
          required: true,
        }),
      },
    }),

    pricing__pricePeriods__connectionFeePeriods__fee: Property.Array({
      displayName: 'Pricing - Price Periods - Connection Fee Periods - Fee',
      description: '',
      required: false,
    }),

    pricing__pricePeriods__energyFeePeriods__fee: Property.Array({
      displayName: 'Pricing - Price Periods - Energy Fee Periods - Fee',
      description: '',
      required: false,
    }),

    pricing__pricePeriods__durationFeePeriods__fee: Property.Array({
      displayName: 'Pricing - Price Periods - Duration Fee Periods - Fee',
      description: '',
      required: false,
    }),

    pricing__pricePeriods__idleFeePeriods__fee: Property.Array({
      displayName: 'Pricing - Price Periods - Idle Fee Periods - Fee',
      description: '',
      required: false,
    }),

    pricing__daysWhenApplied: Property.Array({
      displayName: 'Pricing - Days When Applied',
      description:
        'When left empty, this means that this is the standard pricing that would be applied in general without taking into consideration the day.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: '',
          required: false,
        }),

        specialDates: Property.Json({
          displayName: 'Special Dates',
          defaultValue: {
            type: 'array',
            items: {
              type: 'string',
              format: 'date',
            },
            example: '2022-01-30',
          },
          required: false,
        }),

        idleFeeGracePeriodMinutes: Property.Number({
          displayName: 'Idle Fee Grace Period Minutes',
          description:
            'Idle fee grace period (min). Optional. When idle period (no charging) is detected during a session the user is given this grace period to remove the vehicle, before idle fee starts applying.',
          required: false,
        }),

        idlePricingPeriodInMinutes: Property.StaticDropdown({
          displayName: 'Idle Pricing Period In Minutes',
          description:
            'Idle fee per minute. A fee per minute that is applied during idle period (no charging).',
          required: false,
          options: {
            options: [
              { label: '1', value: '1' },
              { label: '15', value: '15' },
              { label: '30', value: '30' },
              { label: '60', value: '60' },
              { label: '240', value: '240' },
              { label: '360', value: '360' },
            ],
          },
        }),

        connectionFeeMinimumSessionDuration: Property.Number({
          displayName: 'Connection Fee Minimum Session Duration',
          description:
            'Connection Fee Minimum Session Duration (min). Optional.',
          required: false,
        }),

        connectionFeeMinimumSessionEnergy: Property.Number({
          displayName: 'Connection Fee Minimum Session Energy',
          description:
            'Connection Fee Minimum Session Energy (kWh). Optional. Up to 5 digits after the decimal point depending on the currency precision.',
          required: false,
        }),

        durationFeeGracePeriod: Property.Number({
          displayName: 'Duration Fee Grace Period',
          description: 'Duration Fee Grace Period (min). Optional.',
          required: false,
        }),

        pricePeriodInMinutes: Property.StaticDropdown({
          displayName: 'Price Period In Minutes',
          description:
            'Charging period. In minutes. It defines the time-period for charging a fee.',
          required: false,
          options: {
            options: [
              { label: '1', value: '1' },
              { label: '15', value: '15' },
              { label: '30', value: '30' },
              { label: '60', value: '60' },
              { label: '240', value: '240' },
              { label: '360', value: '360' },
            ],
          },
        }),

        pricePeriods__connectionFeePeriods__fee: Property.Json({
          displayName: 'Price Periods - Connection Fee Periods - Fee',
          defaultValue: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          required: false,
        }),

        pricePeriods__energyFeePeriods__fee: Property.Json({
          displayName: 'Price Periods - Energy Fee Periods - Fee',
          defaultValue: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          required: false,
        }),

        pricePeriods__durationFeePeriods__fee: Property.Json({
          displayName: 'Price Periods - Duration Fee Periods - Fee',
          defaultValue: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          required: false,
        }),

        pricePeriods__idleFeePeriods__fee: Property.Json({
          displayName: 'Price Periods - Idle Fee Periods - Fee',
          defaultValue: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          required: false,
        }),
      },
    }),

    pricing__thresholdPriceForEnergy: Property.Number({
      displayName: 'Pricing - Threshold Price For Energy',
      description:
        'Price for kWh to be considered by Optimised charging for setting the charging periods.',
      required: false,
    }),

    pricing__priceForEnergyWhenOptimized: Property.Number({
      displayName: 'Pricing - Price For Energy When Optimized',
      description: '',
      required: false,
    }),

    pricing__optimisedLabel: Property.ShortText({
      displayName: 'Pricing - Optimised Label',
      description: '',
      required: false,
    }),

    pricing__durationFeeFrom: Property.ShortText({
      displayName: 'Pricing - Duration Fee From',
      description: 'Defined start time for the application of duration fees.',
      required: false,
    }),

    pricing__durationFeeTo: Property.ShortText({
      displayName: 'Pricing - Duration Fee To',
      description: 'Defined end time for the application of duration fees.',
      required: false,
    }),

    pricing__subsidyIntegrationId: Property.Number({
      displayName: 'Pricing - Subsidy Integration Id',
      description:
        'The subsidy integration id that should be applied for this tariff. Only valid for Energy ToU tariffs. Please use the AMPECO.CHARGE backend for the specific integration id.',
      required: false,
    }),

    pricing__lockPriceOnSessionStart: Property.StaticDropdown({
      displayName: 'Pricing - Lock Price On Session Start',
      description:
        'When enabled the tariff of the charger will be saved using the pricing interval when the user starts the charging session.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    pricing__lockEnergyPriceOnSessionStart: Property.StaticDropdown({
      displayName: 'Pricing - Lock Energy Price On Session Start',
      description:
        'When enabled the tariff of the charger will be saved using the pricing interval when the user starts the charging session.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    pricing__lockDurationPriceOnSessionStart: Property.StaticDropdown({
      displayName: 'Pricing - Lock Duration Price On Session Start',
      description:
        'When enabled, the energy fee component of the tariff will be saved using the pricing interval when the user starts the charging session.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    pricing__lockIdlePriceOnSessionStart: Property.StaticDropdown({
      displayName: 'Pricing - Lock Idle Price On Session Start',
      description:
        'When enabled, the duration fee component of the tariff will be saved using the pricing interval when the user starts the charging session.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    pricing__stateOfChargeIdleThreshold: Property.StaticDropdown({
      displayName: 'Pricing - State Of Charge Idle Threshold',
      description:
        'Switches the session to idle when the SoC (%) exceeds the selected value. Leave empty to use the system wide setting. This option will take effect only if `Allow custom SoC (%) threshold per Tariff` is set in `Idle period detection` setting.',
      required: false,
      options: {
        options: [
          { label: '75', value: '75' },
          { label: '80', value: '80' },
          { label: '85', value: '85' },
          { label: '90', value: '90' },
          { label: '95', value: '95' },
          { label: '100', value: '100' },
        ],
      },
    }),

    pricing__averagePowerIdleThreshold: Property.Number({
      displayName: 'Pricing - Average Power Idle Threshold',
      description:
        'Sets the session to idle state when the average kW for the past 5 minutes is below the set threshold. This option will take effect only if `Allow custom power threshold per Tariff` is set in `Idle period detection` setting.',
      required: false,
    }),

    stopSession__timeLimitMinutes: Property.Number({
      displayName: 'Stop Session - Time Limit Minutes',
      description:
        'Session max time. The maximum minutes a session is allowed to run. Skip for no time limit.',
      required: false,
    }),

    stopSession__stopWhenEnergyExceedsKwh: Property.Number({
      displayName: 'Stop Session - Stop When Energy Exceeds Kwh',
      description:
        'The maximum energy (kWh) allowed per session. Skip for no limit.',
      required: false,
    }),

    restrictions__applyToUsersOfChargePointOwner: Property.StaticDropdown({
      displayName: 'Restrictions - Apply To Users Of Charge Point Owner',
      description:
        'Makes the tariff apply to users of the partner, who is set as owner of the charge point.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    restrictions__applyToUsersOfChargePointPartner: Property.StaticDropdown({
      displayName: 'Restrictions - Apply To Users Of Charge Point Partner',
      description:
        'Makes the tariff apply to users of the partner, who is set as owner of the charge point.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    restrictions__applyToUsersOfAllRoamingEmsps: Property.StaticDropdown({
      displayName: 'Restrictions - Apply To Users Of All Roaming Emsps',
      description:
        'Makes the tariff apply to users of all eMSPs, which are roaming partners.',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    restrictions__applyToAdHocUsers: Property.StaticDropdown({
      displayName: 'Restrictions - Apply To Ad Hoc Users',
      description:
        'Makes the tariff valid for non-registered users(ad-hoc charging).',
      required: false,
      options: {
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),

    restrictions__adHocPreAuthorizeAmount: Property.Number({
      displayName: 'Restrictions - Ad Hoc Pre Authorize Amount',
      description:
        "Sets the amount that would be blocked on the user's card at the start of the session. Required if applyToAdHocUsers is true and one of the following billing strategies is chosen: `Require payment method and authorize certain amount before starting session` or `Require payment method OR minimum amount in balance`.",
      required: false,
    }),

    restrictions__adHocStopWhenPreAuthorizedAmountFallsBelow: Property.Number({
      displayName:
        'Restrictions - Ad Hoc Stop When Pre Authorized Amount Falls Below',
      description:
        'Set the minimum pre-authorized amount threshold. When the remaining ad hoc pre-authorized amount falls below this value, the charging session will automatically stop to prevent revenue loss.',
      required: false,
    }),

    restrictions__applyToUsersOfPartners: Property.Array({
      displayName: 'Restrictions - Apply To Users Of Partners',
      description:
        'Users of specific Partners. Provide a list of partner IDs. Matches if the user is a invited to at least one of the partners.',
      required: false,
    }),

    restrictions__applyToUsersWithGroups: Property.Array({
      displayName: 'Restrictions - Apply To Users With Groups',
      description:
        'Users with a specific group. Provide a list of user groups. Matches if the user is a member of at least one of the groups.',
      required: false,
    }),

    restrictions__applyToUserGroupIds: Property.Array({
      displayName: 'Restrictions - Apply To User Group Ids',
      description:
        'An array of user group IDs. Users with a specific group. Provide a list of user group IDs.',
      required: false,
    }),

    restrictions__applyToUsersWithSubscriptions: Property.Array({
      displayName: 'Restrictions - Apply To Users With Subscriptions',
      description:
        'Users with a specific subscription plan. Provide a list of subscription plan IDs. Matches if the user has active one of the subscription plans.',
      required: false,
    }),

    restrictions__startDate: Property.DateTime({
      displayName: 'Restrictions - Start Date',
      description: 'The date from which the tariff becomes valid.',
      required: false,
    }),

    restrictions__endDate: Property.DateTime({
      displayName: 'Restrictions - End Date',
      description:
        'The expiry date of the tariff. The tariff is valid until this date inclusive.',
      required: false,
    }),

    partner__id: Property.Number({
      displayName: 'Partner - Id',
      description:
        'The assigned Partner will have access to make changes to the tariff.',
      required: false,
    }),

    display__defaultPriceInformation: Property.ShortText({
      displayName: 'Display - Default Price Information',
      description:
        'The default information that would be shown on the display of the charge point without the user having authorized themselves.',
      required: false,
    }),

    display__defaultPriceInformationOffline: Property.ShortText({
      displayName: 'Display - Default Price Information Offline',
      description:
        'The information that would be shown on the display of the charge point when offline.',
      required: false,
    }),

    display__priceInformation: Property.ShortText({
      displayName: 'Display - Price Information',
      description:
        'The information that would be shown on the display of the charge point for users that are eligible for this tariff.',
      required: false,
    }),

    display__totalCostInformation: Property.ShortText({
      displayName: 'Display - Total Cost Information',
      description:
        'Additional information that would be displayed on the charge point when the session ends, along with the total fees for energy, duration and idle.',
      required: false,
    }),

    integrationId: Property.Number({
      displayName: 'Integration Id',
      description:
        'References the internal integration configuration that enables this tariff type',
      required: false,
    }),
  },
  async run(context): Promise<TariffCreateResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/tariffs/v1.0',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'name',
        'type',
        'dayTariffStart',
        'nightTariffStart',
        'pricing',
        'stopSession',
        'restrictions',
        'partner',
        'display',
        'integrationId',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as TariffCreateResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
