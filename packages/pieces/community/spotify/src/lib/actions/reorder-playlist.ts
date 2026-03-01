import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'reorder_playlist',
  displayName: 'Reorder playlist',
  description: 'Reorders items in the playlist',
  auth: spotifyCommon.authentication,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    from_position: Property.Number({
      displayName: 'From Position',
      required: true,
    }),
    to_position: Property.Number({
      displayName: 'To Position',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount of Items',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    await client.reorderPlaylist(propsValue.playlist_id as string, {
      range_start: propsValue.from_position,
      range_length: propsValue.amount,
      insert_before: propsValue.to_position,
    });
  },
});
