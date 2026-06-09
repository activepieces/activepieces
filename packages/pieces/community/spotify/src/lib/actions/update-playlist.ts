import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'update_playlist',
  displayName: 'Update Playlist',
  description: 'Updates details of the playlist',
  audience: 'both',
  aiMetadata: {
    description: "Updates a playlist's metadata (name, description, public, collaborative) for the playlist identified by its id; only the fields you provide are changed. Use it to rename or re-describe an existing playlist. Idempotent: applying the same values repeatedly leaves the playlist in the same state.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      required: false,
    }),
    collaborative: Property.Checkbox({
      displayName: 'Collaborative',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    await client.updatePlaylist(propsValue.playlist_id as string, {
      name: propsValue.name,
      description: propsValue.description,
      public: propsValue.public,
      collaborative: propsValue.collaborative,
    });
  },
});
