import { Property, createAction } from '@activepieces/pieces-framework';
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi, filterDynamicFields } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getRoles = createAction({
  name: 'get_roles', // Must be a unique across the piece, this shouldn't be changed.
  auth: harvestAuth,
  displayName: 'Get Roles',
  description: 'Fetches Roles',
  audience: 'both',
  aiMetadata: { description: 'Lists all roles defined in a Harvest account, each with its assigned user IDs. Use to discover role IDs or see which users belong to a role. Takes only pagination options. Read-only and idempotent.', idempotent: true },
  props: {
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
        `roles`,
        getAccessTokenOrThrow(context.auth),
        params
      );
  
      return response.body;  },
});

