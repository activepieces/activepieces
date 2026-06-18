import { createAction, Property } from '@activepieces/pieces-framework';
import { klipyAuth } from '../common/auth';
import { klipyClient, Clip } from '../common/client';

export const searchClipsAction = createAction({
  auth: klipyAuth,
  name: 'search_clips',
  displayName: 'Search Clips',
  description: 'Search and retrieve video clips from KLIPY\'s database by keyword or phrase.',
  audience: 'both',
  aiMetadata: { description: 'Searches KLIPY\'s video clip library and returns a paginated set of matching clips. Use when an agent needs to find short video clips for a topic; leave the search keyword empty to browse trending clips instead of filtering to a query. Read-only and idempotent (same input returns the same page). Tune results with paging, locale, and content-safety filter.', idempotent: true },
  props: {
    q: Property.ShortText({
      displayName: 'Search Keyword',
      description: 'The keyword or phrase to search for (e.g. "funny cat", "celebration"). Leave empty to browse trending clips.',
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
      description: 'Number of clips to return per page. Must be between 8 and 50.',
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
    customer_id: Property.ShortText({
      displayName: 'User ID',
      description: 'A unique identifier for the end user in your system. Used to personalize results. Keep this consistent for the same user.',
      required: false,
    }),
  },
  async run(context) {
    const { q, page, per_page, locale, content_filter, customer_id } = context.propsValue;
    const response = await klipyClient.search<Clip>({
      appKey: context.auth.secret_text,
      endpoint: 'clips/search',
      query: q ?? undefined,
      page: page ?? 1,
      perPage: per_page ?? 24,
      locale: locale ?? undefined,
      contentFilter: content_filter ?? undefined,
      customerId: customer_id ?? undefined,
    });

    const items = response.data.data.map(klipyClient.flattenClip);
    return {
      current_page: response.data.current_page,
      per_page: response.data.per_page,
      has_next: response.data.has_next,
      items,
    };
  },
});
