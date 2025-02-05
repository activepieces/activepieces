import { Property, createAction } from "@activepieces/pieces-framework";
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi, filterDynamicFields } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const reportsUninvoiced = createAction({
  name: 'reports-uninvoiced',
  auth: harvestAuth,
  displayName: 'Uninvoiced Report',
  description: 'Uninvoiced hours and expenses for all billable projects',
  props: {
    from: Property.ShortText({
      description: 'Only report on time entries and expenses with a spent_date on or after the given date. (YYYY-MM-DD)',
      displayName: 'From',
      required: true,
    }),
    to: Property.ShortText({
      description: 'Only report on time entries and expenses with a spent_date on or before the given date. (YYYY-MM-DD)',
      displayName: 'To',
      required: true,
    }),
    include_fixed_fee: Property.ShortText({
      description: 'Whether or not to include fixed-fee projects in the response. (Default: true)',
      displayName: 'Include Fixed Fee',
      required: false,
    }),
    page: Property.ShortText({
      description: 'The page number to use in pagination.',
      displayName: 'Page',
      required: false,
    }),
    per_page: Property.ShortText({
      description: 'The number of records to return per page. (1-2000)',
      displayName: 'Records per page',
      required: false,
    }),
  },
  async run(context) {
    // Validate the input properties using Zod
    await propsValidation.validateZod(context.propsValue, {
      per_page: z
      .string()
      .optional()
      .transform((val) => (val === undefined || val === '' ? undefined : parseInt(val, 10)))
      .refine(
        (val) => val === undefined || (Number.isInteger(val) && val >= 1 && val <= 2000),
        'Per Page must be a number between 1 and 2000.'
      ),
    });

    const params = filterDynamicFields(context.propsValue);

    const response = await callHarvestApi(
        HttpMethod.GET,
        `reports/uninvoiced`,
        getAccessTokenOrThrow(context.auth),
        params
      );
  
      return response.body;  },
});