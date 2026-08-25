import { createAction, Property } from '@activepieces/pieces-framework';
import { klipyAuth } from '../common/auth';
import { klipyClient, GifSticker } from '../common/client';

export const searchStickersAction = createAction({
  auth: klipyAuth,
  name: 'search_stickers',
  displayName: 'Search Stickers',
  description: 'Search and retrieve stickers from KLIPY\'s database by keyword or phrase.',
  audience: 'both',
  aiMetadata: { description: 'Searches KLIPY\'s sticker library and returns a paginated set of matching stickers. Use when an agent needs to find stickers for a topic; leave the search keyword empty to browse trending stickers instead of filtering to a query. Read-only and idempotent (same input returns the same page). Tune results with paging, locale, content-safety filter, and format filter.', idempotent: true },
  props: {
    q: Property.ShortText({
      displayName: 'Search Keyword',
      description: 'The keyword or phrase to search for (e.g. "love", "thumbs up"). Leave empty to browse trending stickers.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Which page of results to return. Starts at 1.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of stickers to return per page. Must be between 8 and 50.',
      required: false,
      defaultValue: 24,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'ISO 3166-1 Alpha-2 country code to boost results for a specific region (e.g. "us", "uk", "de"). Leave empty for global results.',
      required: false,
    }),
    content_filter: Property.StaticDropdown({
      displayName: 'Content Filter',
      description: 'Set the content safety level for the results.',
      required: false,
      defaultValue: 'medium',
      options: {
        options: [
          { label: 'High (most strict)', value: 'high' },
          { label: 'Medium (recommended)', value: 'medium' },
          { label: 'Low', value: 'low' },
          { label: 'Off (no filtering)', value: 'off' },
        ],
      },
    }),
    format_filter: Property.ShortText({
      displayName: 'Format Filter',
      description: 'Comma-separated list of formats to include in results. Possible values: gif, webp, png, webm. Leave empty to include all formats.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'User ID',
      description: 'A unique identifier for the end user in your system. Used to personalize results. Keep this consistent for the same user.',
      required: false,
    }),
  },
  async run(context) {
    const { q, page, per_page, locale, content_filter, format_filter, customer_id } = context.propsValue;
    const response = await klipyClient.search<GifSticker>({
      appKey: context.auth.secret_text,
      endpoint: 'stickers/search',
      query: q ?? undefined,
      page: page ?? 1,
      perPage: per_page ?? 24,
      locale: locale ?? undefined,
      contentFilter: content_filter ?? undefined,
      formatFilter: format_filter ?? undefined,
      customerId: customer_id ?? undefined,
    });

    const items = response.data.data.map(klipyClient.flattenGifSticker);
    return {
      current_page: response.data.current_page,
      per_page: response.data.per_page,
      has_next: response.data.has_next,
      items,
    };
  },
});
