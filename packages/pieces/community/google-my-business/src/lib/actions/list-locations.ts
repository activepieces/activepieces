import { propsValidation } from '@activepieces/pieces-common';
import { createAction, isNil } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { listLocationsActionOutputSchema } from '../output-schemas';

export const listLocations = createAction({
  name: 'list-locations',
  outputSchema: listLocationsActionOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Locations',
  description: 'Lists the business locations of an account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the business locations under a Google Business Profile account, with title, address, phone, website, hours, categories, description and placeId. Each location name has the form locations/{id}; pass it (or the bare id) as Location ID to the location, review, media and post actions. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    max_results: gmbApi.props.maxResults(),
  },
  async run(ctx) {
    await propsValidation.validateZod(ctx.propsValue, {
      max_results: z.optional(z.number().check(z.gte(1))),
    });
    const account = gmbApi.resourceNames.accountName(ctx.propsValue.account_id);
    const { items, nextPageToken } = await gmbApi.paginate({
      accessToken: ctx.auth.access_token,
      url: `${gmbApi.hosts.businessInformation}/${account}/locations`,
      query: new URLSearchParams({ readMask: gmbApi.locationReadMask }),
      itemsKey: 'locations',
      pageSize: 100,
      maxResults: ctx.propsValue.max_results ?? 100,
    });
    return {
      locations: items,
      count: items.length,
      ...(isNil(nextPageToken) ? {} : { next_page_token: nextPageToken }),
    };
  },
});
