import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { wistiaAuth } from '../../';

const BASE_URL = 'https://api.wistia.com/v1';

export async function wistiaApiCall<T extends HttpMessageBody>({
  token,
  method,
  resourceUrl,
  query,
  body,
}: {
  token: string;
  method: HttpMethod;
  resourceUrl: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}): Promise<HttpResponse<T>> {
  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${resourceUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

function getAuthToken(auth: unknown): string {
  return (auth as { secret_text: string }).secret_text;
}

export const wistiaCommon = {
  projectDropdown: (required: boolean) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'The project to use.',
      auth: wistiaAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wistia account first.',
          };
        }
        try {
          const response = await wistiaApiCall<WistiaProject[]>({
            token: getAuthToken(auth),
            method: HttpMethod.GET,
            resourceUrl: '/projects.json',
            query: { per_page: 100, sort_by: 'name', sort_direction: 1 },
          });
          return {
            disabled: false,
            options: response.body.map((project) => ({
              label: `${project.name} (${project.mediaCount} media)`,
              value: project.hashedId,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load projects. Check your connection.',
          };
        }
      },
    }),

  projectIdDropdown: (required: boolean) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'Only return media that belong to this project.',
      auth: wistiaAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wistia account first.',
          };
        }
        try {
          const response = await wistiaApiCall<WistiaProject[]>({
            token: getAuthToken(auth),
            method: HttpMethod.GET,
            resourceUrl: '/projects.json',
            query: { per_page: 100, sort_by: 'name', sort_direction: 1 },
          });
          return {
            disabled: false,
            options: response.body.map((project) => ({
              label: `${project.name} (${project.mediaCount} media)`,
              value: project.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load projects. Check your connection.',
          };
        }
      },
    }),

  mediaDropdown: (required: boolean) =>
    Property.Dropdown({
      displayName: 'Media',
      description: 'The video or media file to use.',
      auth: wistiaAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wistia account first.',
          };
        }
        try {
          const response = await wistiaApiCall<WistiaMedia[]>({
            token: getAuthToken(auth),
            method: HttpMethod.GET,
            resourceUrl: '/medias.json',
            query: { per_page: 100, sort_by: 'name', sort_direction: 1 },
          });
          return {
            disabled: false,
            options: response.body.map((media) => ({
              label: `${media.name} (${media.type})`,
              value: media.hashed_id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load media. Check your connection.',
          };
        }
      },
    }),
};

export function flattenMedia(media: WistiaMedia) {
  return {
    id: media.id,
    hashed_id: media.hashed_id,
    name: media.name,
    type: media.type,
    status: media.status ?? null,
    progress: media.progress ?? null,
    section: media.section ?? null,
    description: media.description ?? null,
    duration: media.duration ?? null,
    created: media.created ?? null,
    updated: media.updated ?? null,
    thumbnail_url: media.thumbnail?.url ?? null,
    thumbnail_width: media.thumbnail?.width ?? null,
    thumbnail_height: media.thumbnail?.height ?? null,
    project_id: media.project?.id ?? null,
    project_name: media.project?.name ?? null,
    project_hashed_id: media.project?.hashed_id ?? null,
  };
}

export function flattenProject(project: WistiaProject) {
  return {
    id: project.id,
    hashed_id: project.hashedId,
    name: project.name,
    description: project.description ?? null,
    media_count: project.mediaCount ?? null,
    public: project.public ?? null,
    public_id: project.publicId ?? null,
    anonymous_can_upload: project.anonymousCanUpload ?? null,
    anonymous_can_download: project.anonymousCanDownload ?? null,
    created: project.created ?? null,
    updated: project.updated ?? null,
  };
}

export type WistiaThumbnail = {
  url: string;
  width: number;
  height: number;
};

export type WistiaMedia = {
  id: number;
  hashed_id: string;
  name: string;
  type: string;
  status?: string;
  progress?: number;
  section?: string;
  description?: string;
  duration?: number;
  created?: string;
  updated?: string;
  thumbnail?: WistiaThumbnail;
  project?: {
    id: number;
    name: string;
    hashed_id: string;
  };
};

export type WistiaProject = {
  id: number;
  hashedId: string;
  name: string;
  description?: string;
  mediaCount?: number;
  public?: boolean;
  publicId?: string;
  anonymousCanUpload?: boolean;
  anonymousCanDownload?: boolean;
  created?: string;
  updated?: string;
};
