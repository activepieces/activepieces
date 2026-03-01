import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playlist_info',
  displayName: 'Get Playlist Info',
  description: 'Retrieves details of a playlist',
  auth: spotifyCommon.authentication,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    return await client.getPlaylist(propsValue.playlist_id as string);
  },
});
