import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

const SPOTIFY_URI = /^spotify:[A-Za-z0-9._~-]+(?::[A-Za-z0-9._~%+-]+)+$/;

function contextUri(value: string): string {
  if (value.startsWith('spotify:')) {
    if (!SPOTIFY_URI.test(value)) {
      throw new Error(`"${value.slice(0, 120)}" is not a well-formed Spotify URI.`);
    }
    return value;
  }
  return spotifyIds.parseUri({ value, kinds: ['album', 'artist', 'playlist', 'show', 'audiobook'], label: 'Context URI' });
}

export default createAction({
  name: 'play',
  classification: 'WRITE',
  displayName: 'Play / Resume',
  description: 'Resumes or starts playback',
  audience: 'both',
  aiMetadata: {
    description: 'Starts or resumes playback on the active (or a specified) Spotify device, either for a context URI (album, artist, playlist or show) or for an explicit list of track/episode URIs, never both. With a context you can start at an offset position or URI. Needs Spotify Premium and an open Spotify app. Not idempotent: each call re-issues the playback command and can restart or re-seek the player.',
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playerResult'],
  props: {
    device_id: spotifyCommon.device_id(false),
    context_uri: Property.ShortText({
      displayName: 'Context URI',
      description:
        'Album, artist, playlist or show URI or link. Empty when using Tracks.',
      required: false,
    }),
    tracks: Property.Array({
      displayName: 'Tracks',
      description: 'Track or episode URIs to play. Empty when using a Context URI.',
      required: false,
    }),
    position_ms: Property.Number({
      displayName: 'Position',
      description: 'Position in milliseconds to start the first item at',
      required: false,
    }),
    offset_position: Property.Number({
      displayName: 'Start At Position',
      description: 'With a Context URI: 0-based position to start from.',
      required: false,
    }),
    offset_uri: Property.ShortText({
      displayName: 'Start At Item',
      description: 'With a Context URI: URI of the track or episode to start from.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const contextText = spotifyValidate.optionalText(propsValue.context_uri);
    const context = contextText === undefined ? undefined : contextUri(contextText);
    const uris = spotifyIds.parseUriList({ value: propsValue.tracks, kinds: ['track', 'episode'], label: 'Tracks', allowLocal: true });
    if (context !== undefined && uris.length > 0) {
      throw new Error('Give either a Context URI or Tracks, not both.');
    }
    const positionMs = spotifyValidate.optionalInteger({ value: propsValue.position_ms, field: 'Position', min: 0 });
    const offsetPosition = spotifyValidate.optionalInteger({ value: propsValue.offset_position, field: 'Start At Position', min: 0 });
    const offsetUriText = spotifyValidate.optionalText(propsValue.offset_uri);
    if ((offsetPosition !== undefined || offsetUriText !== undefined) && context === undefined) {
      throw new Error('Start At Position and Start At Item only work together with a Context URI.');
    }
    if (offsetPosition !== undefined && offsetUriText !== undefined) {
      throw new Error('Give either Start At Position or Start At Item, not both.');
    }
    const offsetUri = offsetUriText === undefined
      ? undefined
      : spotifyIds.parseUri({ value: offsetUriText, kinds: ['track', 'episode'], label: 'Start At Item' });
    const offset = offsetPosition !== undefined
      ? { position: offsetPosition }
      : offsetUri !== undefined
        ? { uri: offsetUri }
        : undefined;
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.play({
      device_id: deviceId,
      context_uri: context,
      uris: uris.length > 0 ? uris : undefined,
      position_ms: positionMs,
      offset,
    });
    return { success: true, device_id: deviceId ?? null };
  },
});
