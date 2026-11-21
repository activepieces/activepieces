import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
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
    keep_note: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      placeholder: 'Road Trip Mix',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'New description for the playlist.',
      required: false,
    }),
    change_sharing: Property.Checkbox({
      displayName: 'Change Sharing',
      description: 'Turn on to set Public and Collaborative.',
      required: false,
      defaultValue: false,
      reveals: ['public', 'collaborative'],
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      description: 'On shows it on your profile, off makes it private.',
      required: false,
    }),
    collaborative: Property.Checkbox({
      displayName: 'Collaborative',
      description: 'Lets others edit it; needs Public off.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'playlist', display: 'section', label: 'Playlist to Update', icon: 'inbox', props: ['playlist_id'] },
    { key: 'details', display: 'section', label: 'Changes', icon: 'text', props: ['keep_note', 'name', 'description'] },
    { key: 'sharing', display: 'section', label: 'Sharing', icon: 'users', props: ['change_sharing'] },
  ],
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const name = spotifyValidate.optionalText(propsValue.name);
    const description = spotifyValidate.optionalText(propsValue.description);
    const changeSharing = spotifyValidate.isYes(propsValue.change_sharing);
    const request: PlaylistUpdateRequest = {
      ...(name === undefined ? {} : { name }),
      ...(description === undefined ? {} : { description }),
      ...(changeSharing ? { public: propsValue.public === true, collaborative: propsValue.collaborative === true } : {}),
    };
    const updated = Object.keys(request);
    if (updated.length === 0) {
      throw new Error('Nothing to update: fill in a name or description, or turn on Change Sharing.');
    }
    if (request.collaborative === true && request.public === true) {
      throw new Error('A playlist cannot be public and collaborative at the same time.');
    }
    const client = makeClient({ auth });
    await client.updatePlaylist({ playlistId, request });
    return { playlist_id: playlistId, updated };
  },
});
