import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { Episode } from '../common/models/catalog';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_show_episodes',
  classification: 'SEARCH',
  displayName: 'Get Show Episodes',
  description: 'Lists the episodes of a podcast show',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the episodes of one podcast show (ID, spotify:show: URI or open.spotify.com link), newest first. By default returns one page (limit up to 50, offset); enable All to page through every episode (up to 5,000). Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['showEpisodes'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'show', displayName: 'Show ID', required: true }),
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
    paging_note: spotifyCommon.pagingNote(),
    market: spotifyCommon.market(),
  },
  propertyGroups: [
    { key: 'show', display: 'section', label: 'Show', icon: 'inbox', props: ['id'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['limit', 'all', 'paging_note'] },
  ],
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'show', value: propsValue.id, label: 'Show ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.collectAll({
        fetchPage: (offset) => client.getShowEpisodes({ id, limit: 50, offset, market }),
      });
      const items = res.items.filter((item): item is Episode => item !== null);
      return { total: items.length, items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    const page = await client.getShowEpisodes({ id, limit, offset, market });
    return { ...page, items: page.items.filter((item): item is Episode => item !== null) };
  },
});
