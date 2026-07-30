import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/pieces-framework';

// Client helpers for the projects + sections agent atomics. New plumbing not
// covered by the existing `todoistRestClient` (projects/sections CRUD, get-by-id,
// archived lists). Mirrors the existing rest-client style: httpClient BEARER_TOKEN
// against the Todoist v1 base URL, cursor pagination via `next_cursor`.
const API = 'https://api.todoist.com/api/v1';

type PaginatedResponse<T> = {
  results: T[];
  next_cursor: string | null;
};

async function fetchAllPages<T>(
  token: string,
  url: string,
  baseParams: Record<string, string | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;

  do {
    const queryParams = pickBy(
      { ...baseParams, cursor: cursor ?? undefined },
      isNotUndefined,
    );

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams,
    };

    const response = await httpClient.sendRequest<PaginatedResponse<T>>(request);
    items.push(...response.body.results);
    cursor = response.body.next_cursor;
  } while (cursor);

  return items;
}

export type TodoistProjectFull = {
  id: string;
  name: string;
  color?: string;
  parent_id?: string | null;
  order?: number;
  is_favorite?: boolean;
  is_archived?: boolean;
  view_style?: string;
  description?: string;
  url?: string;
};

export type TodoistSectionFull = {
  id: string;
  name: string;
  project_id: string;
  order?: number;
  is_archived?: boolean;
};

type ProjectCreateBody = {
  name: string;
  color?: string;
  parent_id?: string;
  view_style?: string;
  description?: string;
  is_favorite?: boolean;
  workspace_id?: string;
};

type ProjectUpdateBody = {
  name?: string;
  color?: string;
  view_style?: string;
  description?: string;
  is_favorite?: boolean;
};

type SectionCreateBody = {
  name: string;
  project_id: string;
  order?: number;
};

type SectionUpdateBody = {
  name: string;
};

export const todoistProjectsSectionsClient = {
  projects: {
    async create(token: string, body: ProjectCreateBody): Promise<TodoistProjectFull> {
      const request: HttpRequest<ProjectCreateBody> = {
        method: HttpMethod.POST,
        url: `${API}/projects`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body: pickBy(body, isNotUndefined) as ProjectCreateBody,
      };
      const response = await httpClient.sendRequest<TodoistProjectFull>(request);
      return response.body;
    },

    async update(
      token: string,
      projectId: string,
      body: ProjectUpdateBody,
    ): Promise<TodoistProjectFull> {
      const request: HttpRequest<ProjectUpdateBody> = {
        method: HttpMethod.POST,
        url: `${API}/projects/${projectId}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body: pickBy(body, isNotUndefined) as ProjectUpdateBody,
      };
      const response = await httpClient.sendRequest<TodoistProjectFull>(request);
      return response.body;
    },

    async get(token: string, projectId: string): Promise<TodoistProjectFull> {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/projects/${projectId}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };
      const response = await httpClient.sendRequest<TodoistProjectFull>(request);
      return response.body;
    },

    async unarchive(token: string, projectId: string): Promise<unknown> {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${API}/projects/${projectId}/unarchive`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    },

    async listArchived(token: string): Promise<TodoistProjectFull[]> {
      return fetchAllPages<TodoistProjectFull>(token, `${API}/projects/archived`);
    },
  },

  sections: {
    async create(token: string, body: SectionCreateBody): Promise<TodoistSectionFull> {
      const request: HttpRequest<SectionCreateBody> = {
        method: HttpMethod.POST,
        url: `${API}/sections`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body: pickBy(body, isNotUndefined) as SectionCreateBody,
      };
      const response = await httpClient.sendRequest<TodoistSectionFull>(request);
      return response.body;
    },

    async update(
      token: string,
      sectionId: string,
      body: SectionUpdateBody,
    ): Promise<TodoistSectionFull> {
      const request: HttpRequest<SectionUpdateBody> = {
        method: HttpMethod.POST,
        url: `${API}/sections/${sectionId}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body,
      };
      const response = await httpClient.sendRequest<TodoistSectionFull>(request);
      return response.body;
    },

    async get(token: string, sectionId: string): Promise<TodoistSectionFull> {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/sections/${sectionId}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };
      const response = await httpClient.sendRequest<TodoistSectionFull>(request);
      return response.body;
    },

    async delete(token: string, sectionId: string): Promise<void> {
      try {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${API}/sections/${sectionId}`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        };
        await httpClient.sendRequest(request);
      } catch (error: any) {
        // Treat an already-deleted section (404) as success so the delete is idempotent.
        if (error?.response?.status === 404) {
          return;
        }
        throw error;
      }
    },

    async listArchived(token: string, projectId: string): Promise<TodoistSectionFull[]> {
      // GET /sections/archived is a legacy-mapped endpoint (from the v9
      // `archive/sections`) and does NOT use the documented v1 `{ results }`
      // pagination envelope — it returns the page under a `sections` key (and
      // older variants returned a bare array), with `has_more`/`next_cursor`
      // for pagination. Read whichever shape comes back so the page array is
      // never `undefined` (the cause of the "results is not iterable" failure).
      const items: TodoistSectionFull[] = [];
      let cursor: string | null = null;

      do {
        const queryParams = pickBy(
          { project_id: projectId, cursor: cursor ?? undefined },
          isNotUndefined,
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/sections/archived`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<
          | TodoistSectionFull[]
          | {
              results?: TodoistSectionFull[];
              sections?: TodoistSectionFull[];
              next_cursor?: string | null;
              has_more?: boolean;
            }
        >(request);

        const body = response.body;
        const page = Array.isArray(body)
          ? body
          : body.results ?? body.sections ?? [];
        items.push(...page);

        cursor = Array.isArray(body) ? null : body.next_cursor ?? null;
      } while (cursor);

      return items;
    },
  },
};
