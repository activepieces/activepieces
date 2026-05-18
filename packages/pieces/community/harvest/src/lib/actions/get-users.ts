import { Property, createAction } from '@activepieces/pieces-framework';
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi, filterDynamicFields } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getUsers = createAction({
  name: 'get_users',
  auth: harvestAuth,
  displayName: 'Get Users',
  description: 'Fetches Users',
  props: {
    is_active: Property.ShortText({
    description: 'Pass `true` to only return active users and `false` to return inactive users.',
    displayName: 'Is Active',
    required: false,
  }),
  updated_since: Property.ShortText({
    description: 'Only return users that have been updated since the given date and time.',
    displayName: 'Updated since',
    required: false,
  }),
  page: Property.ShortText({
    description: 'DEPRECATED: The page number to use in pagination.',
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
      `users`,
      getAccessTokenOrThrow(context.auth),
      params
    );

    return response.body;  },
});
