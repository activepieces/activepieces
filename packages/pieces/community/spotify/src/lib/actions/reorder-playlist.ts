import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'reorder_playlist',
  classification: 'WRITE',
  displayName: 'Reorder playlist',
  description: 'Reorders items in the playlist',
  audience: 'both',
  aiMetadata: {
    description: "Moves a block of items within a playlist: takes Amount items (default 1) starting at the 0-based From Position and inserts them before the 0-based To Position. Use it to rearrange playlist order. Not idempotent: positions shift after each move, so repeating the call reorders items differently.",
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistReorder'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    from_position: Property.Number({
      displayName: 'From Position',
      description: '0-based position of the first item to move.',
      required: true,
    }),
    to_position: Property.Number({
      displayName: 'To Position',
      description: '0-based position to insert before. Use the item count for the end.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount of Items',
      description: 'How many items to move, starting at From Position. Defaults to 1.',
      required: false,
    }),
    snapshot_id: Property.ShortText({
      displayName: 'Snapshot ID',
      description: 'Optional snapshot ID to apply the change to that playlist version.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const rangeStart = spotifyValidate.requiredInteger({ value: propsValue.from_position, field: 'From Position', min: 0 });
    const insertBefore = spotifyValidate.requiredInteger({ value: propsValue.to_position, field: 'To Position', min: 0 });
    const rangeLength = spotifyValidate.optionalInteger({ value: propsValue.amount, field: 'Amount of Items', min: 1 });
    const snapshotId = spotifyValidate.optionalText(propsValue.snapshot_id);
    const client = makeClient({ auth });
    const res = await client.reorderPlaylist({
      playlistId,
      request: {
        range_start: rangeStart,
        insert_before: insertBefore,
        ...(rangeLength === undefined ? {} : { range_length: rangeLength }),
        ...(snapshotId === undefined ? {} : { snapshot_id: snapshotId }),
      },
    });
    return { playlist_id: playlistId, snapshot_id: res.snapshot_id };
  },
});
