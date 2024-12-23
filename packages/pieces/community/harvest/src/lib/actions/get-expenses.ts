import { Property, createAction } from "@activepieces/pieces-framework";
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi, filterDynamicFields } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getExpenses = createAction({
  name: 'get_expenses', // Must be a unique across the piece, this shouldn't be changed.
  auth: harvestAuth,
  displayName: 'Get Expenses',
  description: 'Fetches expenses',
  props: {
    from: Property.ShortText({
      description: 'Only return expenses with an spent_date on or after the given date. (YYYY-MM-DD)',
      displayName: 'From',
      required: false,
    }),
    to: Property.ShortText({
      description: 'Only return expenses with an spent_date on or before the given date. (YYYY-MM-DD)',
      displayName: 'To',
      required: false,
    }),
    user_id: Property.ShortText({
      description: 'Only return expenses belonging to the user with the given ID.',
      displayName: 'User Id',
      required: false,
    }),
    client_id: Property.ShortText({
      description: 'Only return expenses belonging to the client with the given ID.',
      displayName: 'Client Id',
      required: false,
    }),
    project_id: Property.ShortText({
      description: 'Only return expenses belonging to the project with the given ID.',
      displayName: 'Project Id',
      required: false,
    }),
    is_billed: Property.ShortText({
      description: 'Pass `true` to only return expenses that have been invoiced and `false` to return expenses that have not been invoiced.',
      displayName: 'Is Billed',
      required: false,
    }),
    updated_since: Property.ShortText({
      description: 'Only return expenses that have been updated since the given date and time.',
      displayName: 'Updated since',
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
        `expenses`,
        getAccessTokenOrThrow(context.auth),
        params
      );
  
      return response.body;  },
});

