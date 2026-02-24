import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/electricity-meter/v1.0/{electricityMeter}/report-consumption

export const electricityMeterReportConsumptionAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterReportConsumption',
  displayName: 'Actions - Electricity Meter - Report Consumption',
  description: 'Add an electricity meter report for the meter readings at the current moment.',
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    required: true,
  }),

  timestamp: Property.DateTime({
    displayName: 'Timestamp',
    description: 'The timestamp of the measurements. ISO 8601 formatted date.',
    required: false,
  }),

  currentL1: Property.Number({
    displayName: 'Current L1',
    description: 'The current on L1 in milliamperes (mA)',
    required: false,
  }),

  currentL2: Property.Number({
    displayName: 'Current L2',
    description: 'The current on L2 in milliamperes (mA)',
    required: false,
  }),

  currentL3: Property.Number({
    displayName: 'Current L3',
    description: 'The current on L3 in milliamperes (mA)',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/electricity-meter/v1.0/{electricityMeter}/report-consumption', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['timestamp', 'currentL1', 'currentL2', 'currentL3']
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
