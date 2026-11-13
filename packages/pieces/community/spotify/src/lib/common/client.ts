import {
  AuthenticationType,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { SearchRequest, SearchResult } from './models/search';
import {
  DeviceListResponse,
  PlaybackPlayRequest,
  PlaybackState,
} from './models/playback';
import {
  Playlist,
  PlaylistCreateRequest,
  PlaylistItem,
  PlaylistReorderItemsRequest,
  PlaylistUpdateRequest,
} from './models/playlist';
import { User } from './models/user';
import {
  CursorPagination,
  Pagination,
  SnapshotResponse,
  SpotifyImage,
} from './models/common';
import { SavedTrack } from './models/library';
import { Album } from './models/album';
import { Artist } from './models/artist';
import { Track } from './models/track';
import {
  Episode,
  QueueResponse,
  RecentlyPlayedResponse,
  Show,
} from './models/catalog';
import { spotifyErrors } from './errors';

const BASE_URL = 'https://api.spotify.com/v1';
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 50;
const DEFAULT_MAX_PAGES = 100;
const PLAYLIST_WRITE_CHUNK = 100;
const LIBRARY_CHUNK = 40;
const PLAYLIST_ADDITIONAL_TYPES = 'track,episode';
const PLAYLIST_MAX_ITEMS = 10_000;
const EMPTY_PLAYLIST_ITEM: PlaylistItem = {
  added_at: null,
  is_local: false,
  item: null,
  track: null,
};

export const SPOTIFY_PAGE_SIZE = PAGE_SIZE;
export const SPOTIFY_PLAYLIST_MAX_ITEMS = PLAYLIST_MAX_ITEMS;
export const SPOTIFY_LIBRARY_CHUNK = LIBRARY_CHUNK;
export const SPOTIFY_PLAYLIST_WRITE_CHUNK = PLAYLIST_WRITE_CHUNK;

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function prepareQuery(request?: Record<string, unknown>): QueryParams {
  if (!request) return {};
  return Object.fromEntries(
    Object.entries(request)
      .filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          (typeof value !== 'string' || value.length > 0) &&
          (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean')
      )
      .map(([key, value]) => [key, String(value)])
  );
}

function chunk<T>({ items, size }: { items: T[]; size: number }): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  );
}

function segment(id: string): string {
  return encodeURIComponent(id);
}

function normalizePlaylistItem(entry: PlaylistItem): PlaylistItem {
  const media = entry.item ?? entry.track ?? null;
  return { ...entry, item: media, track: media };
}

function normalizeContainer<
  C extends { items?: PlaylistItem[] } | undefined
>(container: C): C {
  if (container === undefined || !Array.isArray(container.items)) {
    return container;
  }
  return {
    ...container,
    items: container.items.map((entry) =>
      entry !== null && typeof entry === 'object'
        ? normalizePlaylistItem(entry)
        : EMPTY_PLAYLIST_ITEM
    ),
  };
}

function normalizePlaylist(playlist: Playlist): Playlist {
  const items = normalizeContainer(playlist.items ?? playlist.tracks);
  const tracks = normalizeContainer(playlist.tracks);
  return {
    ...playlist,
    ...(items !== undefined ? { items } : {}),
    ...(tracks !== undefined ? { tracks } : {}),
  };
}

async function collectPages<T>({
  fetchPage,
  maxPages,
  startOffset,
}: {
  fetchPage: (offset: number) => Promise<Pagination<T>>;
  maxPages?: number;
  startOffset?: number;
}): Promise<{ items: T[]; hasMore: boolean }> {
  const budget = maxPages ?? DEFAULT_MAX_PAGES;
  const items: T[] = [];
  let offset = startOffset ?? 0;
  for (let page = 0; page < budget; page++) {
    const res = await fetchPage(offset);
    const pageItems = Array.isArray(res?.items) ? res.items : [];
    for (const item of pageItems) {
      items.push(item);
    }
    if (pageItems.length === 0 || !res.next) {
      return { items, hasMore: false };
    }
    offset += pageItems.length;
  }
  return { items, hasMore: true };
}

export class SpotifyWebApi {
  constructor(private accessToken: string) {}

  async request<T>({
    method,
    path,
    query,
    body,
    operation,
    timeout,
  }: {
    method: HttpMethod;
    path: string;
    query?: Record<string, unknown>;
    body?: object;
    operation: string;
    timeout?: number;
  }): Promise<{ status: number; body: T | undefined }> {
    const dispatcher = await verifiedTls();
    try {
      const res = await httpClient.sendRequest<T>(
        {
          method,
          url: BASE_URL + path,
          queryParams: prepareQuery(query),
          headers: { Accept: 'application/json' },
          body,
          timeout: timeout ?? REQUEST_TIMEOUT_MS,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
          },
        },
        { dispatcher }
      );
      const responseBody: T | undefined =
        res.status === 204 || res.body === '' ? undefined : res.body;
      return { status: res.status, body: responseBody };
    } catch (error) {
      throw spotifyErrors.toError({ error, operation });
    }
  }

  async get<T>({
    path,
    query,
    operation,
  }: {
    path: string;
    query?: Record<string, unknown>;
    operation: string;
  }): Promise<T> {
    const res = await this.request<T>({
      method: HttpMethod.GET,
      path,
      query,
      operation,
    });
    if (res.body === undefined) {
      throw new Error(
        `Spotify could not ${operation}: it returned an empty response (${res.status}).`
      );
    }
    return res.body;
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    return this.get<SearchResult>({
      path: '/search',
      query: { ...request },
      operation: 'search the catalog',
    });
  }

  async getDevices(): Promise<DeviceListResponse> {
    return this.get<DeviceListResponse>({
      path: '/me/player/devices',
      operation: 'list your devices',
    });
  }

  async getPlaybackState(params?: {
    market?: string;
  }): Promise<PlaybackState | null> {
    const res = await this.request<PlaybackState>({
      method: HttpMethod.GET,
      path: '/me/player',
      query: { additional_types: 'track,episode', market: params?.market },
      operation: 'read the playback state',
    });
    return res.body ?? null;
  }

  async playerCommand({
    method,
    path,
    query,
    body,
    operation,
  }: {
    method: HttpMethod;
    path: string;
    query?: Record<string, unknown>;
    body?: object;
    operation: string;
  }): Promise<void> {
    await this.request<unknown>({ method, path, query, body, operation });
  }

  async setVolume({
    volume_percent,
    device_id,
  }: {
    volume_percent: number;
    device_id?: string;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/volume',
      query: { volume_percent, device_id },
      operation: 'set the volume',
    });
  }

  async pause({ device_id }: { device_id?: string }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/pause',
      query: { device_id },
      operation: 'pause playback',
    });
  }

  async play(request: PlaybackPlayRequest): Promise<void> {
    const { device_id, ...rest } = request;
    const body = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined)
    );
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/play',
      query: { device_id },
      body,
      operation: 'start playback',
    });
  }

  async seek({
    position_ms,
    device_id,
  }: {
    position_ms: number;
    device_id?: string;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/seek',
      query: { position_ms, device_id },
      operation: 'seek',
    });
  }

  async skipToNext({ device_id }: { device_id?: string }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.POST,
      path: '/me/player/next',
      query: { device_id },
      operation: 'skip to the next item',
    });
  }

  async skipToPrevious({ device_id }: { device_id?: string }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.POST,
      path: '/me/player/previous',
      query: { device_id },
      operation: 'skip to the previous item',
    });
  }

  async setRepeatMode({
    state,
    device_id,
  }: {
    state: string;
    device_id?: string;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/repeat',
      query: { state, device_id },
      operation: 'set the repeat mode',
    });
  }

  async setShuffle({
    state,
    device_id,
  }: {
    state: boolean;
    device_id?: string;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player/shuffle',
      query: { state, device_id },
      operation: 'set shuffle',
    });
  }

  async transferPlayback({
    device_id,
    play,
  }: {
    device_id: string;
    play?: boolean;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.PUT,
      path: '/me/player',
      body: play === undefined ? { device_ids: [device_id] } : { device_ids: [device_id], play },
      operation: 'transfer playback',
    });
  }

  async addToQueue({
    uri,
    device_id,
  }: {
    uri: string;
    device_id?: string;
  }): Promise<void> {
    await this.playerCommand({
      method: HttpMethod.POST,
      path: '/me/player/queue',
      query: { uri, device_id },
      operation: 'add the item to the queue',
    });
  }

  async getQueue(): Promise<QueueResponse> {
    const res = await this.request<QueueResponse>({
      method: HttpMethod.GET,
      path: '/me/player/queue',
      operation: 'read the queue',
    });
    return res.body ?? { currently_playing: null, queue: [] };
  }

  async getRecentlyPlayed(params: {
    limit?: number;
    after?: number;
    before?: number;
  }): Promise<RecentlyPlayedResponse> {
    return this.get<RecentlyPlayedResponse>({
      path: '/me/player/recently-played',
      query: { ...params },
      operation: 'read recently played tracks',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>({ path: '/me', operation: 'read your profile' });
  }

  async getCurrentUserPlaylists(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Pagination<Playlist>> {
    return this.get<Pagination<Playlist>>({
      path: '/me/playlists',
      query: { ...params },
      operation: 'list your playlists',
    });
  }

  async getAllCurrentUserPlaylists(params?: {
    maxPages?: number;
  }): Promise<{ items: Playlist[]; hasMore: boolean }> {
    const res = await collectPages<Playlist | null>({
      fetchPage: (offset) =>
        this.getCurrentUserPlaylists({ limit: PAGE_SIZE, offset }),
      maxPages: params?.maxPages,
    });
    return {
      items: res.items.filter((item): item is Playlist => item !== null),
      hasMore: res.hasMore,
    };
  }

  async createPlaylist(request: PlaylistCreateRequest): Promise<Playlist> {
    const res = await this.request<Playlist>({
      method: HttpMethod.POST,
      path: '/me/playlists',
      body: request,
      operation: 'create the playlist',
    });
    if (res.body === undefined) {
      throw new Error(
        `Spotify returned an empty response (${res.status}) when creating the playlist; check your playlists before retrying.`
      );
    }
    return res.body;
  }

  async updatePlaylist({
    playlistId,
    request,
  }: {
    playlistId: string;
    request: PlaylistUpdateRequest;
  }): Promise<void> {
    await this.request<unknown>({
      method: HttpMethod.PUT,
      path: `/playlists/${segment(playlistId)}`,
      body: request,
      operation: 'update the playlist',
    });
  }

  async getPlaylist({
    playlistId,
    market,
  }: {
    playlistId: string;
    market?: string;
  }): Promise<Playlist> {
    const playlist = await this.get<Playlist>({
      path: `/playlists/${segment(playlistId)}`,
      query: { market, additional_types: PLAYLIST_ADDITIONAL_TYPES },
      operation: 'read the playlist',
    });
    return normalizePlaylist(playlist);
  }

  async getPlaylistSnapshotId({ playlistId }: { playlistId: string }): Promise<string | undefined> {
    const res = await this.get<{ snapshot_id?: unknown }>({
      path: `/playlists/${segment(playlistId)}`,
      query: { fields: 'snapshot_id' },
      operation: 'read the playlist version',
    });
    return typeof res.snapshot_id === 'string' && res.snapshot_id !== '' ? res.snapshot_id : undefined;
  }

  async getPlaylistCoverImage({
    playlistId,
  }: {
    playlistId: string;
  }): Promise<SpotifyImage[]> {
    const res = await this.request<SpotifyImage[]>({
      method: HttpMethod.GET,
      path: `/playlists/${segment(playlistId)}/images`,
      operation: 'read the playlist cover image',
    });
    return Array.isArray(res.body) ? res.body : [];
  }

  async getPlaylistItems({
    playlistId,
    limit,
    offset,
    market,
  }: {
    playlistId: string;
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<PlaylistItem>> {
    const page = await this.get<Pagination<PlaylistItem>>({
      path: `/playlists/${segment(playlistId)}/items`,
      query: {
        limit,
        offset,
        market,
        additional_types: PLAYLIST_ADDITIONAL_TYPES,
      },
      operation: 'read the playlist items',
    });
    return { ...page, items: normalizeContainer(page).items ?? [] };
  }

  async getAllPlaylistItems({
    playlistId,
    market,
    maxPages,
  }: {
    playlistId: string;
    market?: string;
    maxPages?: number;
  }): Promise<{ items: PlaylistItem[]; hasMore: boolean }> {
    return collectPages<PlaylistItem>({
      fetchPage: (offset) =>
        this.getPlaylistItems({ playlistId, limit: PAGE_SIZE, offset, market }),
      maxPages,
    });
  }

  async getPlaylistItemsWindow({
    playlistId,
    maxItems,
  }: {
    playlistId: string;
    maxItems: number;
  }): Promise<{ items: PlaylistItem[]; hasMore: boolean; total: number; skippedHead: number }> {
    const first = await this.getPlaylistItems({ playlistId, limit: 1, offset: 0 });
    const total = typeof first.total === 'number' ? first.total : 0;
    const startOffset = Math.max(0, total - maxItems);
    const res = await collectPages<PlaylistItem>({
      fetchPage: (offset) =>
        this.getPlaylistItems({ playlistId, limit: PAGE_SIZE, offset }),
      maxPages: Math.ceil(maxItems / PAGE_SIZE) + 1,
      startOffset,
    });
    return { ...res, total, skippedHead: startOffset };
  }

  async getSavedTracks(params?: {
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<SavedTrack>> {
    return this.get<Pagination<SavedTrack>>({
      path: '/me/tracks',
      query: { ...params },
      operation: 'list your saved tracks',
    });
  }

  async getAllSavedTracks(params?: {
    market?: string;
    maxPages?: number;
  }): Promise<{ items: SavedTrack[]; hasMore: boolean }> {
    return collectPages<SavedTrack>({
      fetchPage: (offset) =>
        this.getSavedTracks({ limit: PAGE_SIZE, offset, market: params?.market }),
      maxPages: params?.maxPages,
    });
  }

  async getSavedItems({
    type,
    limit,
    offset,
    market,
  }: {
    type: SavedItemType;
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<Record<string, unknown>>> {
    return this.get<Pagination<Record<string, unknown>>>({
      path: `/me/${type}`,
      query: { limit, offset, market },
      operation: `list your saved ${type}`,
    });
  }

  async getAllSavedItems({
    type,
    market,
    maxPages,
  }: {
    type: SavedItemType;
    market?: string;
    maxPages?: number;
  }): Promise<{ items: Record<string, unknown>[]; hasMore: boolean }> {
    return collectPages<Record<string, unknown>>({
      fetchPage: (offset) =>
        this.getSavedItems({ type, limit: PAGE_SIZE, offset, market }),
      maxPages,
    });
  }

  async addSavedItems({ uris }: { uris: string[] }): Promise<void> {
    await this.libraryWrite({ uris, method: HttpMethod.PUT, verb: 'Saved' });
  }

  async removeSavedItems({ uris }: { uris: string[] }): Promise<void> {
    await this.libraryWrite({ uris, method: HttpMethod.DELETE, verb: 'Removed' });
  }

  async libraryWrite({
    uris,
    method,
    verb,
  }: {
    uris: string[];
    method: HttpMethod;
    verb: string;
  }): Promise<void> {
    const chunks = chunk({ items: uris, size: LIBRARY_CHUNK });
    let done = 0;
    for (const part of chunks) {
      try {
        await this.request<unknown>({
          method,
          path: '/me/library',
          query: { uris: part.join(',') },
          operation:
            method === HttpMethod.PUT
              ? 'save the items to your library'
              : 'remove the items from your library',
        });
      } catch (error) {
        throw done === 0
          ? error
          : spotifyErrors.withProgress({
              error,
              progress: `${verb} ${done} of ${uris.length} items before the failure.`,
            });
      }
      done += part.length;
    }
  }

  async checkSavedItems({ uris }: { uris: string[] }): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const part of chunk({ items: uris, size: LIBRARY_CHUNK })) {
      const res = await this.get<unknown[]>({
        path: '/me/library/contains',
        query: { uris: part.join(',') },
        operation: 'check your library',
      });
      const flags = Array.isArray(res) ? res : [];
      part.forEach((_, index) => results.push(flags[index] === true));
    }
    return results;
  }

  async addItemsToPlaylist({
    playlistId,
    uris,
    position,
  }: {
    playlistId: string;
    uris: string[];
    position?: number;
  }): Promise<{ snapshot_id: string | null; added: number }> {
    let added = 0;
    let snapshotId: string | null = null;
    for (const part of chunk({ items: uris, size: PLAYLIST_WRITE_CHUNK })) {
      try {
        const res = await this.request<SnapshotResponse>({
          method: HttpMethod.POST,
          path: `/playlists/${segment(playlistId)}/items`,
          body:
            position === undefined
              ? { uris: part }
              : { uris: part, position: position + added },
          operation: 'add the items to the playlist',
        });
        snapshotId = res.body?.snapshot_id ?? snapshotId;
      } catch (error) {
        throw added === 0
          ? error
          : spotifyErrors.withProgress({
              error,
              progress: `Added ${added} of ${uris.length} items before the failure; do not re-run the whole list or the first ${added} will be duplicated.`,
            });
      }
      added += part.length;
    }
    return { snapshot_id: snapshotId, added };
  }

  async removeItemsFromPlaylist({
    playlistId,
    uris,
    snapshotId,
  }: {
    playlistId: string;
    uris: string[];
    snapshotId?: string;
  }): Promise<{ snapshot_id: string | null; removed: number }> {
    let removed = 0;
    let snapshot: string | undefined = snapshotId;
    for (const part of chunk({ items: uris, size: PLAYLIST_WRITE_CHUNK })) {
      try {
        const res = await this.request<SnapshotResponse>({
          method: HttpMethod.DELETE,
          path: `/playlists/${segment(playlistId)}/items`,
          body:
            snapshot === undefined
              ? { items: part.map((uri) => ({ uri })) }
              : { items: part.map((uri) => ({ uri })), snapshot_id: snapshot },
          operation: 'remove the items from the playlist',
        });
        snapshot = res.body?.snapshot_id ?? snapshot;
      } catch (error) {
        throw removed === 0
          ? error
          : spotifyErrors.withProgress({
              error,
              progress: `Removed ${removed} of ${uris.length} items before the failure.`,
            });
      }
      removed += part.length;
    }
    return { snapshot_id: snapshot ?? null, removed };
  }

  async reorderPlaylist({
    playlistId,
    request,
  }: {
    playlistId: string;
    request: PlaylistReorderItemsRequest;
  }): Promise<{ snapshot_id: string | null }> {
    const res = await this.request<SnapshotResponse>({
      method: HttpMethod.PUT,
      path: `/playlists/${segment(playlistId)}/items`,
      body: request,
      operation: 'reorder the playlist',
    });
    return { snapshot_id: res.body?.snapshot_id ?? null };
  }

  async replacePlaylistItems({
    playlistId,
    uris,
  }: {
    playlistId: string;
    uris: string[];
  }): Promise<{ snapshot_id: string | null; replaced: number; appended: number }> {
    const [first, ...rest] = chunk({ items: uris, size: PLAYLIST_WRITE_CHUNK });
    const replacedItems = first ?? [];
    const res = await this.request<SnapshotResponse>({
      method: HttpMethod.PUT,
      path: `/playlists/${segment(playlistId)}/items`,
      body: { uris: replacedItems },
      operation: 'replace the playlist items',
    });
    let snapshotId = res.body?.snapshot_id ?? null;
    let appended = 0;
    for (const part of rest) {
      try {
        const added = await this.request<SnapshotResponse>({
          method: HttpMethod.POST,
          path: `/playlists/${segment(playlistId)}/items`,
          body: { uris: part },
          operation: 'append the remaining items to the playlist',
        });
        snapshotId = added.body?.snapshot_id ?? snapshotId;
      } catch (error) {
        throw spotifyErrors.withProgress({
          error,
          progress: `The playlist now holds only ${replacedItems.length + appended} of ${uris.length} items: the first ${replacedItems.length} replaced the old contents and ${appended} more were appended before the failure. Re-running replaces the playlist again from the start.`,
        });
      }
      appended += part.length;
    }
    return { snapshot_id: snapshotId, replaced: replacedItems.length, appended };
  }

  async getTrack({ id, market }: { id: string; market?: string }): Promise<Track> {
    return this.get<Track>({
      path: `/tracks/${segment(id)}`,
      query: { market },
      operation: 'read the track',
    });
  }

  async getAlbum({ id, market }: { id: string; market?: string }): Promise<Album> {
    return this.get<Album>({
      path: `/albums/${segment(id)}`,
      query: { market },
      operation: 'read the album',
    });
  }

  async getAlbumTracks({
    id,
    limit,
    offset,
    market,
  }: {
    id: string;
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<Track>> {
    return this.get<Pagination<Track>>({
      path: `/albums/${segment(id)}/tracks`,
      query: { limit, offset, market },
      operation: 'list the album tracks',
    });
  }

  async getArtist({ id }: { id: string }): Promise<Artist> {
    return this.get<Artist>({
      path: `/artists/${segment(id)}`,
      operation: 'read the artist',
    });
  }

  async getArtistAlbums({
    id,
    include_groups,
    limit,
    offset,
    market,
  }: {
    id: string;
    include_groups?: string;
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<Album>> {
    return this.get<Pagination<Album>>({
      path: `/artists/${segment(id)}/albums`,
      query: { include_groups, limit, offset, market },
      operation: "list the artist's albums",
    });
  }

  async getShow({ id, market }: { id: string; market?: string }): Promise<Show> {
    return this.get<Show>({
      path: `/shows/${segment(id)}`,
      query: { market },
      operation: 'read the show',
    });
  }

  async getShowEpisodes({
    id,
    limit,
    offset,
    market,
  }: {
    id: string;
    limit?: number;
    offset?: number;
    market?: string;
  }): Promise<Pagination<Episode | null>> {
    return this.get<Pagination<Episode | null>>({
      path: `/shows/${segment(id)}/episodes`,
      query: { limit, offset, market },
      operation: 'list the show episodes',
    });
  }

  async getEpisode({ id, market }: { id: string; market?: string }): Promise<Episode> {
    return this.get<Episode>({
      path: `/episodes/${segment(id)}`,
      query: { market },
      operation: 'read the episode',
    });
  }

  async getFollowedArtists({
    limit,
    after,
  }: {
    limit?: number;
    after?: string;
  }): Promise<CursorPagination<Artist>> {
    const res = await this.get<{ artists?: CursorPagination<Artist> | null }>({
      path: '/me/following',
      query: { type: 'artist', limit, after },
      operation: 'list your followed artists',
    });
    if (res.artists === undefined || res.artists === null) {
      throw new Error(
        'Spotify could not list your followed artists: the response had no "artists" object.'
      );
    }
    return res.artists;
  }

  async collectAll<T>({
    fetchPage,
    maxPages,
  }: {
    fetchPage: (offset: number) => Promise<Pagination<T>>;
    maxPages?: number;
  }): Promise<{ items: T[]; hasMore: boolean }> {
    return collectPages({ fetchPage, maxPages });
  }
}

export type SavedItemType = 'albums' | 'shows' | 'episodes';
