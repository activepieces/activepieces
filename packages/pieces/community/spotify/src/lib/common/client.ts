import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { SearchRequest, SearchResult } from './models/search';
import {
  DeviceListResponse,
  PlaybackPauseRequest,
  PlaybackPlayRequest,
  PlaybackSeekRequest,
  PlaybackState,
  PlaybackVolumeRequest,
} from './models/playback';
import {
  Playlist,
  PlaylistAddItemsRequest,
  PlaylistCreateRequest,
  PlaylistItem,
  PlaylistRemoveItemsRequest,
  PlaylistReorderItemsRequest,
  PlaylistUpdateRequest,
} from './models/playlist';
import { User } from './models/user';
import { Pagination, PaginationRequest } from './models/common';

function emptyValueFilter(
  accessor: (key: string) => any
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  return params;
}

export class SpotifyWebApi {
  constructor(private accessToken: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: 'https://api.spotify.com/v1' + url,
      queryParams: query,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    });
    return res.body;
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    const res = await this.makeRequest<SearchResult>(
      HttpMethod.GET,
      '/search',
      prepareQuery(request)
    );
    return res;
  }

  async getDevices(): Promise<DeviceListResponse> {
    return await this.makeRequest<DeviceListResponse>(
      HttpMethod.GET,
      '/me/player/devices'
    );
  }

  async getPlaybackState(): Promise<PlaybackState> {
    return await this.makeRequest<PlaybackState>(HttpMethod.GET, '/me/player');
  }

  async setVolume(request: PlaybackVolumeRequest) {
    await this.makeRequest(
      HttpMethod.PUT,
      '/me/player/volume',
      prepareQuery(request)
    );
  }

  async pause(request: PlaybackPauseRequest) {
    await this.makeRequest(
      HttpMethod.PUT,
      '/me/player/pause',
      prepareQuery(request)
    );
  }

  async play(request: PlaybackPlayRequest) {
    const query: QueryParams = {};
    if (request.device_id) query.device_id = request.device_id;
    request.device_id = undefined;
    await this.makeRequest(HttpMethod.PUT, '/me/player/play', query, request);
  }

  async seek(request: PlaybackSeekRequest) {
    await this.makeRequest(
      HttpMethod.PUT,
      '/me/player/seek',
      prepareQuery(request)
    );
  }

  async getCurrentUser(): Promise<User> {
    return await this.makeRequest<User>(HttpMethod.GET, '/me');
  }

  async getCurrentUserPlaylists(
    request?: PaginationRequest
  ): Promise<Pagination<Playlist>> {
    return await this.makeRequest<Pagination<Playlist>>(
      HttpMethod.GET,
      '/me/playlists',
      prepareQuery(request)
    );
  }

  async getAllCurrentUserPlaylists(): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    let total = 99999;
    while (playlists.length < total) {
      const res = await this.getCurrentUserPlaylists({
        limit: 50,
        offset: playlists.length,
      });
      total = res.total;
      res.items.forEach((item) => playlists.push(item));
    }
    return playlists;
  }

  async createPlaylist(
    userId: string,
    request: PlaylistCreateRequest
  ): Promise<Playlist> {
    return await this.makeRequest<Playlist>(
      HttpMethod.POST,
      '/users/' + userId + '/playlists',
      undefined,
      request
    );
  }

  async updatePlaylist(id: string, request: PlaylistUpdateRequest) {
    await this.makeRequest(
      HttpMethod.PUT,
      '/playlists/' + id,
      undefined,
      request
    );
  }

  async getPlaylist(id: string): Promise<Playlist> {
    return await this.makeRequest<Playlist>(HttpMethod.GET, '/playlists/' + id);
  }

  async getPlaylistItems(
    id: string,
    request?: PaginationRequest
  ): Promise<Pagination<PlaylistItem>> {
    return await this.makeRequest<Pagination<PlaylistItem>>(
      HttpMethod.GET,
      '/playlists/' + id + '/tracks',
      prepareQuery(request)
    );
  }

  async getAllPlaylistItems(id: string): Promise<PlaylistItem[]> {
    const items: PlaylistItem[] = [];
    let total = 99999;
    while (items.length < total) {
      const res = await this.getPlaylistItems(id, {
        limit: 50,
        offset: items.length,
      });
      total = res.total;
      res.items.forEach((item) => items.push(item));
    }
    return items;
  }

  async addItemsToPlaylist(id: string, request: PlaylistAddItemsRequest) {
    await this.makeRequest(
      HttpMethod.POST,
      '/playlists/' + id + '/tracks',
      undefined,
      request
    );
  }

  async removeItemsFromPlaylist(
    id: string,
    request: PlaylistRemoveItemsRequest
  ) {
    await this.makeRequest(
      HttpMethod.DELETE,
      '/playlists/' + id + '/tracks',
      undefined,
      request
    );
  }

  async reorderPlaylist(id: string, request: PlaylistReorderItemsRequest) {
    await this.makeRequest(
      HttpMethod.PUT,
      '/playlists/' + id + '/tracks',
      undefined,
      request
    );
  }
}
