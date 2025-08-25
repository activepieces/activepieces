import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.vimeo.com';

export interface VimeoVideo {
  uri: string;
  name: string;
  description: string | null;
  created_time: string;
  modified_time: string;
  privacy: {
    view: string;
  };
  user: {
    name: string;
    uri: string;
  };
  embed: {
    html: string;
  };
  link: string;
}

export interface VimeoUser {
  uri: string;
  name: string;
}

export interface VimeoAlbum {
  uri: string;
  name: string;
  description: string | null;
}

export class VimeoClient {
  constructor(private auth: OAuth2PropertyValue) {}

  async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${endpoint}`,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.access_token,
      },
    });

    return response.body;
  }

  async getUserVideos(page = 1, per_page = 25): Promise<{ data: VimeoVideo[] }> {
    return this.makeRequest<{ data: VimeoVideo[] }>(
      HttpMethod.GET,
      `/me/videos?page=${page}&per_page=${per_page}&sort=date`
    );
  }

  async getLikedVideos(page = 1, per_page = 25): Promise<{ data: VimeoVideo[] }> {
    return this.makeRequest<{ data: VimeoVideo[] }>(
      HttpMethod.GET,
      `/me/likes?page=${page}&per_page=${per_page}&sort=date`
    );
  }

  async searchVideos(query: string, page = 1, per_page = 25): Promise<{ data: VimeoVideo[] }> {
    return this.makeRequest<{ data: VimeoVideo[] }>(
      HttpMethod.GET,
      `/videos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&sort=date`
    );
  }

  async getUserByUri(userUri: string): Promise<VimeoUser> {
    return this.makeRequest<VimeoUser>(
      HttpMethod.GET,
      userUri
    );
  }

  async getUserVideosByUri(userUri: string, page = 1, per_page = 25): Promise<{ data: VimeoVideo[] }> {
    return this.makeRequest<{ data: VimeoVideo[] }>(
      HttpMethod.GET,
      `${userUri}/videos?page=${page}&per_page=${per_page}&sort=date`
    );
  }

  async uploadVideoFromUrl(
    videoUrl: string,
    name: string,
    description?: string,
    privacy = 'anybody'
  ): Promise<VimeoVideo> {
    // First, download the video from the URL
    const videoResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: videoUrl,
    });

    // Create the video placeholder
    const createResponse = await this.makeRequest<{
      uri: string;
      upload: { upload_link: string };
    }>(HttpMethod.POST, '/me/videos', {
      name,
      description,
      privacy: { view: privacy },
    });

    // Upload the video file
    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: createResponse.upload.upload_link,
      body: videoResponse.body,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    // Return the created video
    return this.makeRequest<VimeoVideo>(HttpMethod.GET, createResponse.uri);
  }

  async uploadVideo(
    videoData: Buffer,
    name: string,
    description?: string,
    privacy = 'anybody'
  ): Promise<VimeoVideo> {
    // First, create the video placeholder
    const createResponse = await this.makeRequest<{
      uri: string;
      upload: { upload_link: string };
    }>(HttpMethod.POST, '/me/videos', {
      name,
      description,
      privacy: { view: privacy },
    });

    // Upload the video file
    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: createResponse.upload.upload_link,
      body: videoData,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    // Return the created video
    return this.makeRequest<VimeoVideo>(HttpMethod.GET, createResponse.uri);
  }

  async deleteVideo(videoUri: string): Promise<void> {
    await this.makeRequest(HttpMethod.DELETE, videoUri);
  }

  async addVideoToAlbum(albumUri: string, videoUri: string): Promise<void> {
    await this.makeRequest(HttpMethod.PUT, `${albumUri}/videos${videoUri}`);
  }

  async getUserAlbums(): Promise<{ data: VimeoAlbum[] }> {
    return this.makeRequest<{ data: VimeoAlbum[] }>(
      HttpMethod.GET,
      '/me/albums'
    );
  }
}
