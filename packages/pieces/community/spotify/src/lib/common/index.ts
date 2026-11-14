import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  MarkdownVariant,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { SpotifyWebApi } from './client';
import { Device } from './models/playback';
import { Playlist } from './models/playlist';
import { User } from './models/user';

const markdownDescription = `
Connect with your own Spotify app:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in. The account that owns the app needs **Spotify Premium**, otherwise Spotify stops the app.
2. Click **Create app**, give it a name and description, and tick **Web API**.
3. Under **Redirect URIs**, add the Redirect URL shown below. Spotify only accepts HTTPS addresses (or a loopback IP); \`http://localhost\` is rejected.
4. Save, then open **Settings** and copy the **Client ID** and **Client secret** into the fields below.
5. New apps run in **Development mode**: open **User Management** and add the email of every Spotify account that will connect (up to 5). Development-mode apps also get fewer catalog fields, a search limit of 10 results, and can only read the items of playlists the user owns or collaborates on.

Player controls (play, pause, skip, volume, queue) need Spotify Premium and an open Spotify app or web player on some device.
`;

function placeholderFor(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

function toInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : NaN;
  return Number.isInteger(number) ? number : NaN;
}

function optionalInteger({
  value,
  field,
  min,
  max,
}: {
  value: unknown;
  field: string;
  min: number;
  max?: number;
}): number | undefined {
  const number = toInteger(value);
  if (number === undefined) {
    return undefined;
  }
  if (
    !Number.isInteger(number) ||
    number < min ||
    (max !== undefined && number > max)
  ) {
    const range =
      max === undefined ? `${min} or more` : `between ${min} and ${max}`;
    throw new Error(`${field} must be a whole number ${range}.`);
  }
  return number;
}

function requiredInteger({
  value,
  field,
  min,
  max,
}: {
  value: unknown;
  field: string;
  min: number;
  max?: number;
}): number {
  const number = optionalInteger({ value, field, min, max });
  if (number === undefined) {
    throw new Error(`${field} is required.`);
  }
  return number;
}

function market(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    return undefined;
  }
  if (text === 'from_token') {
    return text;
  }
  if (!/^[A-Za-z]{2}$/.test(text)) {
    throw new Error(
      `Market must be a two-letter country code such as US or DE, got "${text.slice(0, 20)}".`
    );
  }
  return text.toUpperCase();
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text === '' ? undefined : text;
}

function clearableText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function deviceId(value: unknown): string | undefined {
  return optionalText(value);
}

function yesNo({ value, field }: { value: unknown; field: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === 'yes' || value === true) {
    return true;
  }
  if (value === 'no' || value === false) {
    return false;
  }
  throw new Error(`${field} must be "yes" or "no".`);
}

function isYes(value: unknown): boolean {
  return value === true || value === 'true' || value === 'yes';
}

function deviceLabel(device: Device): string {
  return `${device.name} (${device.type}${device.is_active ? ', active' : ''})`;
}

function playlistLabel(playlist: Playlist): string {
  const total = playlist.items?.total ?? playlist.tracks?.total;
  if (typeof total !== 'number') {
    return playlist.name;
  }
  return `${playlist.name} (${total} ${total === 1 ? 'item' : 'items'})`;
}

function epochOf(value: unknown): number | undefined {
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function isCheckpoint(value: unknown): value is SpotifyCheckpoint {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const ms: unknown = Reflect.get(value, 'ms');
  const keys: unknown = Reflect.get(value, 'keys');
  return typeof ms === 'number' && Array.isArray(keys) && keys.every((key) => typeof key === 'string');
}

function baseline<T>({ entries }: { entries: SpotifyPollEntry<T>[] }): SpotifyCheckpoint {
  const ms = entries.reduce((max, entry) => (entry.ms > max ? entry.ms : max), 0);
  return { ms, keys: entries.filter((entry) => entry.ms === ms).map((entry) => entry.key) };
}

function newSince<T>({ entries, checkpoint }: { entries: SpotifyPollEntry<T>[]; checkpoint: SpotifyCheckpoint }): { emitted: T[]; checkpoint: SpotifyCheckpoint } {
  const seenAtCheckpoint = new Set(checkpoint.keys);
  const fresh = entries
    .filter((entry) => entry.ms > checkpoint.ms || (entry.ms === checkpoint.ms && !seenAtCheckpoint.has(entry.key)))
    .sort((a, b) => a.ms - b.ms);
  const maxMs = fresh.reduce((max, entry) => (entry.ms > max ? entry.ms : max), checkpoint.ms);
  const keysAtMax = fresh.filter((entry) => entry.ms === maxMs).map((entry) => entry.key);
  const keys = maxMs === checkpoint.ms ? Array.from(new Set([...checkpoint.keys, ...keysAtMax])) : Array.from(new Set(keysAtMax));
  return { emitted: fresh.map((entry) => entry.data), checkpoint: { ms: maxMs, keys } };
}

export function makeClient(propsValue: {
  auth: OAuth2PropertyValue;
}): SpotifyWebApi {
  const token = getAccessTokenOrThrow(propsValue.auth);
  return new SpotifyWebApi(token);
}

export const spotifyValidate = {
  optionalInteger,
  requiredInteger,
  market,
  optionalText,
  clearableText,
  deviceId,
  yesNo,
  isYes,
};

export const spotifyPolling = {
  epochOf,
  isCheckpoint,
  baseline,
  newSince,
};

export const spotifyCommon = {
  authentication: PieceAuth.OAuth2({
    description: markdownDescription,
    required: true,
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scope: [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-playback-position',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-library-read',
      'user-library-modify',
      'user-follow-read',
      'user-follow-modify',
    ],
    getConnectionIdentifier: async ({ auth }) => {
      try {
        const client = new SpotifyWebApi(auth.access_token);
        const response = await client.request<User>({
          method: HttpMethod.GET,
          path: '/me',
          operation: 'read your profile',
          timeout: 5000,
        });
        const user = response.body;
        return user?.email || user?.display_name || user?.id || undefined;
      } catch {
        return undefined;
      }
    },
  }),
  device_id: (required = true) =>
    Property.Dropdown({
      auth: spotifyCommon.authentication,
      displayName: 'Device',
      description: required
        ? 'Device to move playback to, with Spotify open on it.'
        : 'Empty uses the active device, which needs Spotify open.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Spotify account first.',
            options: [],
          };
        }
        try {
          const client = makeClient({ auth });
          const res = await client.getDevices();
          const options = res.devices.flatMap((device) =>
            device.id === null ? [] : [{ label: deviceLabel(device), value: device.id }]
          );
          return {
            disabled: false,
            placeholder:
              options.length === 0
                ? 'No devices found. Open Spotify on a device and refresh.'
                : undefined,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: placeholderFor(error),
            options: [],
          };
        }
      },
    }),
  playlist_id: (required = true) =>
    Property.Dropdown({
      auth: spotifyCommon.authentication,
      displayName: 'Playlist',
      description:
        'Pick a playlist, or enter its ID, URI or open.spotify.com link.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Spotify account first.',
            options: [],
          };
        }
        try {
          const client = makeClient({ auth });
          const playlists = await client.getAllCurrentUserPlaylists({
            maxPages: 20,
          });
          return {
            disabled: false,
            placeholder:
              playlists.items.length === 0
                ? 'No playlists found. Create one in Spotify first.'
                : undefined,
            options: playlists.items.map((playlist) => ({
              label: playlistLabel(playlist),
              value: playlist.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: placeholderFor(error),
            options: [],
          };
        }
      },
    }),
  catalogId: ({
    kind,
    displayName,
    required,
  }: {
    kind: string;
    displayName: string;
    required: boolean;
  }) =>
    Property.ShortText({
      displayName,
      description: `The ${kind} ID, spotify:${kind}: URI or open.spotify.com link.`,
      required,
      placeholder: `https://open.spotify.com/${kind}/…`,
    }),
  market: (params?: { advanced?: boolean }) =>
    Property.ShortText({
      displayName: 'Market',
      description: 'Two-letter country code; empty uses your account country.',
      placeholder: 'US',
      required: false,
      advanced: params?.advanced ?? true,
    }),
  limit: ({ max, defaultHint }: { max: number; defaultHint: number }) =>
    Property.Number({
      displayName: 'Limit',
      description: `How many to return, from 1 to ${max}.`,
      required: false,
      display: 'stepper',
      min: 1,
      max,
      step: 1,
      defaultValue: defaultHint,
    }),
  offset: () =>
    Property.Number({
      displayName: 'Offset',
      description: 'How many items to skip, starting from 0.',
      required: false,
      advanced: true,
    }),
  all: (params?: { maxItems?: number }) =>
    Property.Checkbox({
      displayName: 'Fetch All Pages',
      description: `Gets every page, up to ${(params?.maxItems ?? 5000).toLocaleString('en-US')} items.`,
      required: false,
      defaultValue: false,
    }),
  pagingNote: (params?: { fields?: string }) =>
    Property.MarkDown({
      value: `When Fetch All Pages is on, ${params?.fields ?? 'Limit and Offset'} are ignored.`,
      variant: MarkdownVariant.INFO,
    }),
};

export type SpotifyCheckpoint = { ms: number; keys: string[] };

export type SpotifyPollEntry<T> = { key: string; ms: number; data: T };
