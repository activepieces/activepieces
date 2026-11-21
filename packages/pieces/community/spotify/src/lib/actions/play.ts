import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
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
  return spotifyIds.parseUri({ value, kinds: ['album', 'artist', 'playlist', 'show', 'audiobook'], label: 'Play From' });
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
    what_note: Property.MarkDown({
      value: 'Fill in Play From or Tracks, not both. Leave both empty to resume.',
      variant: MarkdownVariant.INFO,
    }),
    context_uri: Property.ShortText({
      displayName: 'Play From',
      description: 'Album, artist, playlist, show or audiobook URI or link.',
      placeholder: 'https://open.spotify.com/playlist/…',
      required: false,
    }),
    tracks: Property.Array({
      displayName: 'Tracks',
      description: 'Track or episode URIs or links, played in order.',
      required: false,
    }),
    start_note: Property.MarkDown({
      value: 'Start At Position or Start At Item needs Play From; use only one.',
      variant: MarkdownVariant.INFO,
    }),
    position_ms: Property.Number({
      displayName: 'Position',
      description: 'Milliseconds into the first item, e.g. 90000 for 1:30.',
      required: false,
    }),
    offset_position: Property.Number({
      displayName: 'Start At Position',
      description: 'Position in the album or playlist, counting from 0.',
      required: false,
    }),
    offset_uri: Property.ShortText({
      displayName: 'Start At Item',
      description: 'Track or episode URI or link to start at.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'what', display: 'section', label: 'What to Play', icon: 'send', props: ['what_note', 'context_uri', 'tracks'] },
    { key: 'start', display: 'section', label: 'Where to Start', icon: 'sliders', props: ['start_note', 'offset_position', 'offset_uri', 'position_ms'] },
  ],
  async run({ auth, propsValue }) {
    const contextText = spotifyValidate.optionalText(propsValue.context_uri);
    const context = contextText === undefined ? undefined : contextUri(contextText);
    const uris = spotifyIds.parseUriList({ value: propsValue.tracks, kinds: ['track', 'episode'], label: 'Tracks', allowLocal: true });
    if (context !== undefined && uris.length > 0) {
      throw new Error('Give either Play From or Tracks, not both.');
    }
    const positionMs = spotifyValidate.optionalInteger({ value: propsValue.position_ms, field: 'Position', min: 0 });
    const offsetPosition = spotifyValidate.optionalInteger({ value: propsValue.offset_position, field: 'Start At Position', min: 0 });
    const offsetUriText = spotifyValidate.optionalText(propsValue.offset_uri);
    if ((offsetPosition !== undefined || offsetUriText !== undefined) && context === undefined) {
      throw new Error('Start At Position and Start At Item only work together with Play From.');
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
