import { propsValidation } from '@activepieces/pieces-common';
import { createAction, isNil } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { listMediaActionOutputSchema } from '../output-schemas';

export const listMedia = createAction({
  name: 'list-media',
  outputSchema: listMediaActionOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Media',
  description: 'Lists the photos and videos of a location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the photos and videos attached to a Google Business Profile location with format, Google URL, category and view count, plus the total media count. The last segment of each media name is the Media ID for Get Media. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    max_results: gmbApi.props.maxResults(),
  },
  async run(ctx) {
    await propsValidation.validateZod(ctx.propsValue, {
      max_results: z.optional(z.number().check(z.gte(1))),
    });
    const { account_id, location_id, max_results } = ctx.propsValue;
    const parent = gmbApi.resourceNames.v4Location({ account: account_id, location: location_id });
    const { items, nextPageToken, lastPage } = await gmbApi.paginate({
      accessToken: ctx.auth.access_token,
      url: `${gmbApi.hosts.v4}/${parent}/media`,
      itemsKey: 'mediaItems',
      pageSize: 100,
      maxResults: max_results ?? 100,
    });
    return {
      media_items: items,
      count: items.length,
      total_media_item_count: lastPage['totalMediaItemCount'] ?? 0,
      ...(isNil(nextPageToken) ? {} : { next_page_token: nextPageToken }),
    };
  },
});
