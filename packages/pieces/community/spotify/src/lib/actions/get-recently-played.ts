import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

function timestamp({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const ms = typeof value === 'number' ? value : Date.parse(String(value));
  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error(`${field} must be a date and time, for example 2026-01-31T18:00:00Z.`);
  }
  return Math.floor(ms);
}

export default createAction({
  name: 'get_recently_played',
  classification: 'SEARCH',
  displayName: 'Get Recently Played Tracks',
  description: 'Lists the tracks you played most recently',
  audience: 'both',
  aiMetadata: {
    description: "Lists up to 50 tracks the user played most recently (podcast episodes are not included), each with played_at and the playing context. Optionally only plays after, or only plays before, a given date and time (not both). Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['recentlyPlayed'],
  props: {
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    after: Property.DateTime({
      displayName: 'Played After',
      description: 'Only plays after this moment. Leave empty for the latest plays.',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Played Before',
      description: 'Only plays before this moment. Cannot be used with Played After.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const after = timestamp({ value: propsValue.after, field: 'Played After' });
    const before = timestamp({ value: propsValue.before, field: 'Played Before' });
    if (after !== undefined && before !== undefined) {
      throw new Error('Give either Played After or Played Before, not both.');
    }
    const client = makeClient({ auth });
    const res = await client.getRecentlyPlayed({ limit, after, before });
    return {
      items: Array.isArray(res.items) ? res.items : [],
      cursors: res.cursors ?? null,
      next: res.next ?? null,
    };
  },
});
