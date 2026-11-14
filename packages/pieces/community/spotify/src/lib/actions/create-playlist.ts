import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'create_playlist',
  classification: 'WRITE',
  displayName: 'Create Playlist',
  description: 'Creates a new playlist for the current user',
  audience: 'both',
  aiMetadata: {
    description: "Creates a new empty playlist owned by the current user with the given name and optional description. Set Public to true for a public playlist; when an agent leaves it unset or false the playlist is private. Collaborative needs Public false. Use it to set up a playlist before adding items. Not idempotent: each call creates a separate playlist even with identical input. Spotify's own reads may still report public: true for a playlist that was set private, so do not use a follow-up read to confirm visibility.",
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['createdPlaylist'],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      placeholder: 'Road Trip Mix',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Shown under the playlist name.',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      description: 'On shows it on your profile, off keeps it private.',
      required: false,
    }),
    collaborative: Property.Checkbox({
      displayName: 'Collaborative',
      description: 'Lets others edit it; needs Public off.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const name = spotifyValidate.optionalText(propsValue.name);
    if (name === undefined) {
      throw new Error('Name is required.');
    }
    if (propsValue.collaborative === true && propsValue.public !== false) {
      throw new Error('A collaborative playlist must be private: turn Public off (set it to false) when Collaborative is on.');
    }
    const client = makeClient({ auth });
    return client.createPlaylist({
      name,
      description: spotifyValidate.optionalText(propsValue.description),
      public: propsValue.public,
      collaborative: propsValue.collaborative,
    });
  },
});
