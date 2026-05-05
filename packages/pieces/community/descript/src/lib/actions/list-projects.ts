import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

type Project = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export const descriptListProjectsAction = createAction({
  auth: descriptAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description:
    'Returns projects in your Descript Drive. Supports filtering by name, date, and creator.',
  props: {
    name: Property.ShortText({
      displayName: 'Name Filter',
      description:
        'Return only projects whose name contains this string (case-insensitive).',
      required: false,
    }),
    created_by: Property.StaticDropdown({
      displayName: 'Created By',
      description: 'Filter projects by creator.',
      required: false,
      options: {
        options: [
          { label: 'Anyone', value: '' },
          { label: 'Me', value: 'me' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by.',
      required: false,
      defaultValue: 'created_at',
      options: {
        options: [
          { label: 'Date created', value: 'created_at' },
          { label: 'Date updated', value: 'updated_at' },
          { label: 'Name', value: 'name' },
          { label: 'Last viewed', value: 'last_viewed_at' },
        ],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort order for results.',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest first (desc)', value: 'desc' },
          { label: 'Oldest first (asc)', value: 'asc' },
        ],
      },
    }),
    created_after: Property.ShortText({
      displayName: 'Created After',
      description:
        'Return only projects created after this date (ISO 8601, e.g. 2025-01-01T00:00:00Z).',
      required: false,
    }),
    created_before: Property.ShortText({
      displayName: 'Created Before',
      description:
        'Return only projects created before this date (ISO 8601, e.g. 2025-12-31T23:59:59Z).',
      required: false,
    }),
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Return only projects updated after this date (ISO 8601, e.g. 2025-01-01T00:00:00Z).',
      required: false,
    }),
    updated_before: Property.ShortText({
      displayName: 'Updated Before',
      description:
        'Return only projects updated before this date (ISO 8601, e.g. 2025-12-31T23:59:59Z).',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      created_by,
      sort,
      direction,
      created_after,
      created_before,
      updated_after,
      updated_before,
    } = context.propsValue;

    const apiKey = descriptCommon.getAuthToken(context.auth);

    const baseParams: Record<string, string> = { limit: '100' };
    if (sort) baseParams['sort'] = sort;
    if (direction) baseParams['direction'] = direction;
    if (name) baseParams['name'] = name;
    if (created_by) baseParams['created_by'] = created_by;
    if (created_after) baseParams['created_after'] = created_after;
    if (created_before) baseParams['created_before'] = created_before;
    if (updated_after) baseParams['updated_after'] = updated_after;
    if (updated_before) baseParams['updated_before'] = updated_before;

    const projects: Project[] = [];
    let cursor: string | undefined = undefined;

    do {
      const queryParams: Record<string, string> = {
        ...baseParams,
        ...(cursor ? { cursor } : {}),
      };

      const response = await descriptCommon.descriptApiCall<{
        data: Project[];
        pagination: { next_cursor?: string };
      }>({
        apiKey,
        method: HttpMethod.GET,
        path: '/projects',
        queryParams,
      });

      projects.push(...response.body.data);
      cursor = response.body.pagination.next_cursor;
    } while (cursor);

    return projects.map((p) => ({
      project_id: p.id,
      project_name: p.name,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  },
});
