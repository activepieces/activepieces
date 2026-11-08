import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';
import { PlaylistUpdateRequest } from '../common/models/playlist';

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export default createAction({
  name: 'update_playlist_details',
  classification: 'WRITE',
  displayName: 'Update Playlist Details',
  description: 'Changes the name, description, visibility or collaboration setting of a playlist',
  audience: 'ai',
  aiMetadata: {
    description: "Changes a playlist's name, description, public or collaborative setting. Only the fields you pass are changed (an empty description clears it); leave public and collaborative out to keep their current values (pass 'yes' or 'no' to change them). A collaborative playlist must be private. Get the playlist id from Get Playlists. Idempotent: the same values leave the playlist in the same state. Spotify's own reads may still report public: true for a playlist that was set private, so do not use a follow-up read to confirm visibility.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistUpdate'],
  props: {
    playlist_id: Property.ShortText({
      displayName: 'Playlist ID',
      description: 'Playlist ID, spotify:playlist: URI or open.spotify.com link.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New playlist name. Omit to keep the current name.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'New description. Omit to keep it; an empty string clears it.',
      required: false,
    }),
    public: Property.StaticDropdown<string>({
      displayName: 'Public',
      description: "'yes' makes it public, 'no' private. Omit to keep the current setting.",
      required: false,
      options: { options: YES_NO_OPTIONS },
    }),
    collaborative: Property.StaticDropdown<string>({
      displayName: 'Collaborative',
      description: "'yes' lets others edit (playlist must be private). Omit to keep it.",
      required: false,
      options: { options: YES_NO_OPTIONS },
    }),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist ID' });
    const name = spotifyValidate.optionalText(propsValue.name);
    const description = spotifyValidate.clearableText(propsValue.description);
    const isPublic = spotifyValidate.yesNo({ value: propsValue.public, field: 'Public' });
    const collaborative = spotifyValidate.yesNo({ value: propsValue.collaborative, field: 'Collaborative' });
    const request: PlaylistUpdateRequest = {
      ...(name === undefined ? {} : { name }),
      ...(description === undefined ? {} : { description }),
      ...(isPublic === undefined ? {} : { public: isPublic }),
      ...(collaborative === undefined ? {} : { collaborative }),
    };
    const updated = Object.keys(request);
    if (updated.length === 0) {
      throw new Error('Nothing to update: pass name, description, public or collaborative.');
    }
    if (collaborative === true && isPublic === true) {
      throw new Error('A playlist cannot be public and collaborative at the same time. Pass public "no" with collaborative "yes".');
    }
    const client = makeClient({ auth });
    await client.updatePlaylist({ playlistId, request });
    return { playlist_id: playlistId, updated };
  },
});
