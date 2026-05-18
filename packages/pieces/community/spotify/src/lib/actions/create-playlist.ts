import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'create_playlist',
  displayName: 'Create Playlist',
  description: 'Creates a new playlist for the current user',
  auth: spotifyCommon.authentication,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
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
    const user = await client.getCurrentUser();
    const res = await client.createPlaylist(user.id, {
      name: propsValue.name,
      description: propsValue.description,
      public: propsValue.public,
      collaborative: propsValue.collaborative,
    });
    return res;
  },
});
