import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { Artist } from '../common/models/artist';
import { spotifyOutputSchemas } from '../output-schemas';

const MAX_PAGES = 100;

export default createAction({
  name: 'get_followed_artists',
  classification: 'SEARCH',
  auth: spotifyCommon.authentication,
  displayName: 'Get Followed Artists',
  description: 'Lists the artists you follow',
  audience: 'both',
  aiMetadata: {
    description: "Lists the artists the current user follows. Returns one page (limit up to 50) plus next_after, the cursor to pass as After for the next page; enable All to page through every followed artist (up to 5,000). Read-only and repeatable.",
    idempotent: true,
  },
  outputSchema: spotifyOutputSchemas['followedArtists'],
  props: {
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    after: Property.ShortText({
      displayName: 'Next Page Cursor',
      description: 'The next_after value from an earlier run; empty starts at the top.',
      required: false,
      advanced: true,
    }),
    all: spotifyCommon.all(),
    paging_note: spotifyCommon.pagingNote({ fields: 'Limit and Next Page Cursor' }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const items: Artist[] = [];
      let after: string | undefined = undefined;
      let total: number | undefined = undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const res = await client.getFollowedArtists({ limit: 50, after });
        total = res.total ?? total;
        const pageItems = Array.isArray(res.items) ? res.items : [];
        pageItems.forEach((item) => items.push(item));
        const next = res.cursors?.after ?? undefined;
        if (pageItems.length === 0 || !res.next || !next) {
          return { total: total ?? items.length, items, next_after: null, has_more: false };
        }
        after = next;
      }
      return { total: total ?? items.length, items, next_after: after ?? null, has_more: true };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const res = await client.getFollowedArtists({ limit, after: spotifyValidate.optionalText(propsValue.after) });
    return {
      total: res.total ?? null,
      items: Array.isArray(res.items) ? res.items : [],
      next_after: res.next ? res.cursors?.after ?? null : null,
    };
  },
});
