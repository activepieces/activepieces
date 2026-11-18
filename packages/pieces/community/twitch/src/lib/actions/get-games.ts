import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getGames = createAction({
  auth: twitchAuth,
  name: 'get_games',
  displayName: 'Get Categories',
  description: 'Get Twitch categories (games) by ID, exact name or IGDB ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up Twitch categories (games) by category ID, exact name or IGDB ID (up to 100 values combined). Names must match exactly; use Search Categories for fuzzy matching. Returns games[] with id, name, box_art_url (a {width}x{height} template) and igdb_id. Unknown values are silently omitted.',
    idempotent: true,
  },
  props: {
    ids: Property.Array({
      displayName: 'Category IDs',
      required: false,
    }),
    names: Property.Array({
      displayName: 'Exact Names',
      required: false,
    }),
    igdb_ids: Property.Array({
      displayName: 'IGDB IDs',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'games',
        label: 'Categories', labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Category ID' },
          { key: 'name', label: 'Name' },
          { key: 'box_art_url', label: 'Box Art URL Template' },
          { key: 'igdb_id', label: 'IGDB ID' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const ids = twitchCommon.toStringList(propsValue.ids);
    const names = twitchCommon.toStringList(propsValue.names);
    const igdbIds = twitchCommon.toStringList(propsValue.igdb_ids);
    const totalValues = ids.length + names.length + igdbIds.length;
    if (totalValues === 0 || totalValues > 100) {
      throw new Error('Provide between 1 and 100 category IDs, names or IGDB IDs combined.');
    }
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/games',
      query: {
        id: ids.length > 0 ? ids : undefined,
        name: names.length > 0 ? names : undefined,
        igdb_id: igdbIds.length > 0 ? igdbIds : undefined,
      },
    });
    return { games: response.body.data ?? [] };
  },
});
