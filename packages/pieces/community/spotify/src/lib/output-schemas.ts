import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const externalUrlField: OutputSchemaField = {
  key: 'external_urls',
  label: 'Links',
  children: [{ key: 'spotify', label: 'Spotify URL', format: 'url' }],
};

const imageFields: OutputSchemaField[] = [
  { key: 'url', label: 'Image URL', format: 'image' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'width', label: 'Width', format: 'number' },
];

const imagesField: OutputSchemaField = {
  key: 'images',
  label: 'Images',
  labelKey: 'url',
  listItems: imageFields,
};

const artistSimpleFields: OutputSchemaField[] = [
  { key: 'id', label: 'Artist ID' },
  { key: 'name', label: 'Artist Name' },
  { key: 'uri', label: 'Artist URI' },
  externalUrlField,
];

const artistsField: OutputSchemaField = {
  key: 'artists',
  label: 'Artists',
  labelKey: 'name',
  listItems: artistSimpleFields,
};

const artistFields: OutputSchemaField[] = [
  ...artistSimpleFields,
  imagesField,
];

const followersField: OutputSchemaField = {
  key: 'followers',
  label: 'Followers',
  children: [{ key: 'total', label: 'Follower Count', format: 'number' }],
};

const albumSimpleFields: OutputSchemaField[] = [
  { key: 'id', label: 'Album ID' },
  { key: 'name', label: 'Album Name' },
  { key: 'uri', label: 'Album URI' },
  { key: 'album_type', label: 'Album Type' },
  { key: 'total_tracks', label: 'Total Tracks', format: 'number' },
  { key: 'release_date', label: 'Release Date' },
  { key: 'release_date_precision', label: 'Release Date Precision' },
  artistsField,
  imagesField,
  externalUrlField,
];

const trackSimpleFields: OutputSchemaField[] = [
  { key: 'id', label: 'Track ID' },
  { key: 'name', label: 'Track Name' },
  { key: 'uri', label: 'Track URI' },
  { key: 'type', label: 'Type' },
  { key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
  { key: 'explicit', label: 'Explicit', format: 'boolean' },
  { key: 'track_number', label: 'Track Number', format: 'number' },
  { key: 'disc_number', label: 'Disc Number', format: 'number' },
  { key: 'is_local', label: 'Is Local File', format: 'boolean' },
  { key: 'is_playable', label: 'Is Playable', format: 'boolean' },
  artistsField,
  externalUrlField,
];

const trackFields: OutputSchemaField[] = [
  ...trackSimpleFields,
  { key: 'album', label: 'Album', children: albumSimpleFields },
];

const showFields: OutputSchemaField[] = [
  { key: 'id', label: 'Show ID' },
  { key: 'name', label: 'Show Name' },
  { key: 'uri', label: 'Show URI' },
  { key: 'description', label: 'Description' },
  { key: 'media_type', label: 'Media Type' },
  { key: 'total_episodes', label: 'Total Episodes', format: 'number' },
  { key: 'explicit', label: 'Explicit', format: 'boolean' },
  imagesField,
  externalUrlField,
];

const episodeSimpleFields: OutputSchemaField[] = [
  { key: 'id', label: 'Episode ID' },
  { key: 'name', label: 'Episode Name' },
  { key: 'uri', label: 'Episode URI' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
  { key: 'release_date', label: 'Release Date' },
  { key: 'explicit', label: 'Explicit', format: 'boolean' },
  { key: 'language', label: 'Language' },
  {
    key: 'resume_point',
    label: 'Resume Point',
    children: [
      { key: 'fully_played', label: 'Fully Played', format: 'boolean' },
      { key: 'resume_position_ms', label: 'Resume Position (ms)', format: 'number' },
    ],
  },
  imagesField,
  externalUrlField,
];

const episodeFields: OutputSchemaField[] = [
  ...episodeSimpleFields,
  { key: 'show', label: 'Show', children: showFields },
];

const mediaFields: OutputSchemaField[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'uri', label: 'URI' },
  { key: 'type', label: 'Type' },
  { key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
  { key: 'explicit', label: 'Explicit', format: 'boolean' },
  { key: 'is_local', label: 'Is Local File', format: 'boolean' },
  { key: 'is_playable', label: 'Is Playable', format: 'boolean' },
  artistsField,
  { key: 'album', label: 'Album', children: albumSimpleFields },
  { key: 'show', label: 'Show', children: showFields },
  externalUrlField,
];

const userFields: OutputSchemaField[] = [
  { key: 'id', label: 'User ID' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'uri', label: 'User URI' },
  externalUrlField,
];

const playlistFields: OutputSchemaField[] = [
  { key: 'id', label: 'Playlist ID' },
  { key: 'name', label: 'Playlist Name' },
  { key: 'uri', label: 'Playlist URI' },
  { key: 'description', label: 'Description' },
  { key: 'public', label: 'Public', format: 'boolean' },
  { key: 'collaborative', label: 'Collaborative', format: 'boolean' },
  { key: 'snapshot_id', label: 'Snapshot ID' },
  { key: 'owner', label: 'Owner', children: userFields },
  followersField,
  {
    key: 'items',
    label: 'Items Summary',
    children: [{ key: 'total', label: 'Total Items', format: 'number' }],
  },
  imagesField,
  externalUrlField,
];

const playlistItemFields: OutputSchemaField[] = [
  { key: 'added_at', label: 'Added At', format: 'datetime' },
  { key: 'added_by', label: 'Added By', children: [{ key: 'id', label: 'User ID' }] },
  { key: 'is_local', label: 'Is Local File', format: 'boolean' },
  { key: 'item', label: 'Item', children: mediaFields },
];

const deviceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Device ID' },
  { key: 'name', label: 'Device Name' },
  { key: 'type', label: 'Device Type' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'is_private_session', label: 'Private Session', format: 'boolean' },
  { key: 'is_restricted', label: 'Restricted', format: 'boolean' },
  { key: 'volume_percent', label: 'Volume (%)', format: 'number' },
  { key: 'supports_volume', label: 'Supports Volume', format: 'boolean' },
];

const pagingFields: OutputSchemaField[] = [
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'offset', label: 'Offset', format: 'number' },
  { key: 'next', label: 'Next Page URL', format: 'url' },
  {
    key: 'has_more',
    label: 'More Items Not Fetched',
    format: 'boolean',
    description: 'Only present in All mode: true when the page cap was reached before the end of the list.',
  },
];

function paging({ label, labelKey, items }: { label: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      ...pagingFields,
      { key: 'items', label, labelKey, listItems: items },
    ],
  };
}

const playbackFields: OutputSchemaField[] = [
  { key: 'is_playing', label: 'Is Playing', format: 'boolean' },
  { key: 'progress_ms', label: 'Progress (ms)', format: 'number' },
  { key: 'timestamp', label: 'Timestamp (epoch ms)', format: 'number' },
  { key: 'shuffle_state', label: 'Shuffle', format: 'boolean' },
  { key: 'smart_shuffle', label: 'Smart Shuffle', format: 'boolean' },
  {
    key: 'actions',
    label: 'Player Actions',
    children: [{ key: 'disallows', label: 'Disallowed Actions', dynamicKey: true }],
  },
  { key: 'repeat_state', label: 'Repeat Mode' },
  { key: 'currently_playing_type', label: 'Playing Type' },
  { key: 'device', label: 'Device', children: deviceFields },
  {
    key: 'context',
    label: 'Context',
    children: [
      { key: 'type', label: 'Context Type' },
      { key: 'uri', label: 'Context URI' },
    ],
  },
  { key: 'item', label: 'Item', children: mediaFields },
];

const playerResultFields: OutputSchemaField[] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'device_id', label: 'Device ID' },
];

const playHistoryFields: OutputSchemaField[] = [
  { key: 'played_at', label: 'Played At', format: 'datetime' },
  { key: 'track', label: 'Track', children: trackFields },
  {
    key: 'context',
    label: 'Context',
    children: [
      { key: 'type', label: 'Context Type' },
      { key: 'uri', label: 'Context URI' },
    ],
  },
];

const libraryResultFields: OutputSchemaField[] = [
  { key: 'uris', label: 'URIs' },
  {
    key: 'count',
    label: 'Items Sent',
    format: 'number',
    description: 'How many URIs were sent to Spotify; Spotify does not report how many were actually changed.',
  },
];

const playlistUpdateFields: OutputSchemaField[] = [
  { key: 'playlist_id', label: 'Playlist ID' },
  { key: 'updated', label: 'Updated Fields' },
];

export const spotifyOutputSchemas = {
  search: {
    fields: [
      { key: 'tracks', label: 'Tracks', labelKey: 'name', listItems: trackFields },
      { key: 'artists', label: 'Artists', labelKey: 'name', listItems: artistFields },
      { key: 'albums', label: 'Albums', labelKey: 'name', listItems: albumSimpleFields },
      { key: 'playlists', label: 'Playlists', labelKey: 'name', listItems: playlistFields },
      { key: 'shows', label: 'Shows', labelKey: 'name', listItems: showFields },
      { key: 'episodes', label: 'Episodes', labelKey: 'name', listItems: episodeSimpleFields },
    ],
  },
  playback: { fields: playbackFields },
  playerResult: { fields: playerResultFields },
  setVolume: {
    fields: [
      ...playerResultFields,
      { key: 'volume_percent', label: 'Volume (%)', format: 'number' },
    ],
  },
  seek: {
    fields: [
      ...playerResultFields,
      { key: 'position_ms', label: 'Position (ms)', format: 'number' },
    ],
  },
  playerState: {
    fields: [...playerResultFields, { key: 'state', label: 'State' }],
  },
  transferPlayback: {
    fields: [
      ...playerResultFields,
      { key: 'play', label: 'Play Requested', format: 'boolean' },
    ],
  },
  addToQueue: {
    fields: [...playerResultFields, { key: 'uri', label: 'URI' }],
  },
  playlists: paging({ label: 'Playlists', labelKey: 'name', items: playlistFields }),
  playlist: {
    fields: [
      ...playlistFields.filter((field) => field.key !== 'items'),
      {
        key: 'items',
        label: 'Items',
        children: [
          { key: 'total', label: 'Total Items', format: 'number' },
          { key: 'items', label: 'Items', labelKey: 'added_at', listItems: playlistItemFields },
        ],
      },
    ],
  },
  playlistItems: paging({ label: 'Items', labelKey: 'added_at', items: playlistItemFields }),
  savedTracks: paging({
    label: 'Saved Tracks',
    labelKey: 'added_at',
    items: [
      { key: 'added_at', label: 'Added At', format: 'datetime' },
      { key: 'track', label: 'Track', children: trackFields },
    ],
  }),
  savedItems: paging({
    label: 'Saved Items',
    labelKey: 'added_at',
    items: [
      { key: 'added_at', label: 'Added At', format: 'datetime' },
      { key: 'album', label: 'Album', children: albumSimpleFields },
      { key: 'show', label: 'Show', children: showFields },
      { key: 'episode', label: 'Episode', children: episodeSimpleFields },
    ],
  }),
  createdPlaylist: { fields: playlistFields },
  playlistUpdate: { fields: playlistUpdateFields },
  playlistAdd: {
    fields: [
      { key: 'playlist_id', label: 'Playlist ID' },
      { key: 'snapshot_id', label: 'Snapshot ID' },
      { key: 'added', label: 'Items Added', format: 'number' },
    ],
  },
  playlistRemove: {
    fields: [
      { key: 'playlist_id', label: 'Playlist ID' },
      { key: 'snapshot_id', label: 'Snapshot ID' },
      {
        key: 'removed',
        label: 'Items Sent for Removal',
        format: 'number',
        description: 'How many URIs were sent; Spotify does not report how many were actually in the playlist.',
      },
    ],
  },
  playlistReorder: {
    fields: [
      { key: 'playlist_id', label: 'Playlist ID' },
      { key: 'snapshot_id', label: 'Snapshot ID' },
    ],
  },
  playlistReplace: {
    fields: [
      { key: 'playlist_id', label: 'Playlist ID' },
      { key: 'snapshot_id', label: 'Snapshot ID' },
      { key: 'replaced', label: 'Items In First Write', format: 'number' },
      { key: 'appended', label: 'Items Appended', format: 'number' },
    ],
  },
  libraryWrite: { fields: libraryResultFields },
  libraryCheck: {
    fields: [
      {
        key: 'results',
        label: 'Results',
        labelKey: 'uri',
        listItems: [
          { key: 'uri', label: 'URI' },
          { key: 'saved', label: 'Saved', format: 'boolean' },
        ],
      },
    ],
  },
  coverImage: {
    fields: [{ key: 'images', label: 'Images', labelKey: 'url', listItems: imageFields }],
  },
  currentUser: {
    fields: [
      ...userFields,
      { key: 'account_id', label: 'Account ID' },
      imagesField,
    ],
  },
  followedArtists: {
    fields: [
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'next_after', label: 'Next Page Cursor' },
      {
        key: 'has_more',
        label: 'More Items Not Fetched',
        format: 'boolean',
        description: 'Only present in All mode: true when the page cap was reached before the end of the list.',
      },
      { key: 'items', label: 'Artists', labelKey: 'name', listItems: artistFields },
    ],
  },
  track: { fields: trackFields },
  album: {
    fields: [
      ...albumSimpleFields,
      {
        key: 'tracks',
        label: 'Tracks',
        children: [
          { key: 'total', label: 'Total Tracks', format: 'number' },
          { key: 'items', label: 'Tracks', labelKey: 'name', listItems: trackSimpleFields },
        ],
      },
    ],
  },
  albumTracks: paging({ label: 'Tracks', labelKey: 'name', items: trackSimpleFields }),
  artist: { fields: artistFields },
  artistAlbums: paging({ label: 'Albums', labelKey: 'name', items: albumSimpleFields }),
  show: { fields: showFields },
  showEpisodes: paging({ label: 'Episodes', labelKey: 'name', items: episodeSimpleFields }),
  episode: { fields: episodeFields },
  devices: {
    fields: [{ key: 'devices', label: 'Devices', labelKey: 'name', listItems: deviceFields }],
  },
  queue: {
    fields: [
      { key: 'currently_playing', label: 'Currently Playing', children: mediaFields },
      { key: 'queue', label: 'Queue', labelKey: 'name', listItems: mediaFields },
    ],
  },
  recentlyPlayed: {
    fields: [
      { key: 'next', label: 'Next Page URL', format: 'url' },
      {
        key: 'cursors',
        label: 'Cursors',
        children: [
          { key: 'after', label: 'After' },
          { key: 'before', label: 'Before' },
        ],
      },
      { key: 'items', label: 'Plays', labelKey: 'played_at', listItems: playHistoryFields },
    ],
  },
  playlistItemsChangedTrigger: {
    fields: [
      { key: 'total', label: 'Total Items', format: 'number' },
      { key: 'items', label: 'Items', labelKey: 'added_at', listItems: playlistItemFields },
    ],
  },
  newSavedTrackTrigger: {
    fields: [
      { key: 'added_at', label: 'Added At', format: 'datetime' },
      { key: 'track', label: 'Track', children: trackFields },
    ],
  },
  newPlaylistItemTrigger: {
    fields: [
      { key: 'playlist_id', label: 'Playlist ID' },
      ...playlistItemFields,
    ],
  },
  newRecentlyPlayedTrigger: { fields: playHistoryFields },
} satisfies Record<string, OutputSchema>;
