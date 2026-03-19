import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from './auth';

export async function apiRequest({
  auth,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: {
  auth: any;
  path: string;
  method?: HttpMethod;
  body?: any;
  queryParams?: Record<string, string>;
}) {
  const baseUrl = 'https://api.vimeo.com';

  let headers: Record<string, string> | undefined = {
    'Accept': 'application/vnd.vimeo.*+json;version=3.4',
  };

  if (body) {
    if (body instanceof FormData) {
      headers = { ...headers, 'Content-Type': 'multipart/form-data' };
    } else if (body.constructor === Object) {
      headers = { ...headers, 'Content-Type': 'application/json' };
    }
  }

  try {
    return await httpClient.sendRequest({
      method,
      url: `${baseUrl}${path}`,
      body,
      queryParams,
      timeout: 30000,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      ...(headers ? { headers } : {}),
    });
  }
  catch(err: any){
    if (err.response?.body?.error) {
      const vimeoError = err.response.body.error;
      throw new Error(`Vimeo API error: ${vimeoError.description || vimeoError.message || vimeoError}`);
    }

    const statusCode = err.response?.status;
    if (statusCode === 429) throw new Error('Rate limit exceeded. Please try again later.');
    if (statusCode === 401) throw new Error('Authentication failed. Please check your Vimeo credentials.');
    if (statusCode === 404) throw new Error('Resource not found.');

    throw new Error(`Vimeo API error: ${err.message || err}`);
  }
}

export const userFolderDropdown = Property.Dropdown({
  auth: vimeoAuth,
  displayName: 'Folder ID',
  description: 'ID of the folder to add the video to',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    const response = await apiRequest({
      auth,
      path: '/me/folders',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '100',
      },
    });

    const folders = response.body.data.map((folder: any) => ({
      value: folder.uri.split('/').pop(),
      label: folder.name,
    }));

    return {
      options: folders,
    };
  },
});

export const userVideoDropdown = Property.Dropdown({
  auth: vimeoAuth,
  displayName: 'Video ID',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const response = await apiRequest({
      auth,
      path: '/me/videos',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '100',
      },
    });

    const videos = response.body.data.map((video: any) => ({
      value: video.uri.split('/').pop(),
      label: video.name,
    }));

    return {
      options: videos,
    };
  },
});