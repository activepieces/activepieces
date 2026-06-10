import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'play',
  displayName: 'Play / Resume',
  description: 'Resumes or starts playback',
  audience: 'both',
  aiMetadata: {
    description: 'Starts or resumes playback on the active (or a specified) Spotify device, optionally for a given context URI (album, artist, playlist) or an explicit list of track URIs, and an optional start position. Use it to begin playing something; requires an active device. Not idempotent: each call re-issues the playback command and can restart or re-seek the player.',
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  props: {
    device_id: spotifyCommon.device_id(false),
    context_uri: Property.ShortText({
      displayName: 'Context URI',
      description:
        'Spotify URI of the context to play (album, artist, playlist)',
      required: false,
    }),
    tracks: Property.Array({
      displayName: 'Tracks',
      description: 'List of spotify track uris to play',
      required: false,
    }),
    position_ms: Property.Number({
      displayName: 'Position',
      description: 'Position in milliseconds',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    const res = await client.play({
      device_id: propsValue.device_id,
      context_uri: propsValue.context_uri,
      uris: propsValue.tracks as string[],
      position_ms: propsValue.position_ms,
    });
    return res;
  },
});
