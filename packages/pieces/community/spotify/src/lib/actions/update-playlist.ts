import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';
import { PlaylistUpdateRequest } from '../common/models/playlist';

export default createAction({
  name: 'update_playlist',
  classification: 'WRITE',
  displayName: 'Update Playlist',
  description: 'Updates details of the playlist',
  audience: 'human',
  aiMetadata: {
    description: "Updates a playlist's metadata (name, description, public, collaborative) for the playlist identified by its id; only the fields you provide are changed, and an empty description clears it. Idempotent: applying the same values repeatedly leaves the playlist in the same state. Spotify's own reads may still report public: true for a playlist that was set private, so do not use a follow-up read to confirm visibility.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistUpdate'],
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
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const name = spotifyValidate.optionalText(propsValue.name);
    const description = spotifyValidate.clearableText(propsValue.description);
    const request: PlaylistUpdateRequest = {
      ...(name === undefined ? {} : { name }),
      ...(description === undefined ? {} : { description }),
      ...(typeof propsValue.public === 'boolean' ? { public: propsValue.public } : {}),
      ...(typeof propsValue.collaborative === 'boolean' ? { collaborative: propsValue.collaborative } : {}),
    };
    const updated = Object.keys(request);
    if (updated.length === 0) {
      throw new Error('Nothing to update: set a name, description, Public or Collaborative.');
    }
    if (request.collaborative === true && request.public === true) {
      throw new Error('A playlist cannot be public and collaborative at the same time.');
    }
    const client = makeClient({ auth });
    await client.updatePlaylist({ playlistId, request });
    return { playlist_id: playlistId, updated };
  },
});

