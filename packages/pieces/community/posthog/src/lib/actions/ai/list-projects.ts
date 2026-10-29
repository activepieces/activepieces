import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const projectsOutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Projects',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Project ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'organizationId', label: 'Organization ID' },
        { key: 'timezone', label: 'Timezone' },
        { key: 'isCurrentConnection', label: 'Is Connection Project', format: 'boolean' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
  ],
} satisfies OutputSchema;

export const listProjects = createAction({
  auth: posthogAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'List the projects in the current organization.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog projects in the organization of the API key (the current organization), with id, name, organizationId, timezone and isCurrentConnection (true for the project this connection is set to; every other action works only on that project). Paged with limit (1-100, default 50) and offset (use nextOffset). Read-only.',
    idempotent: true,
  },
  outputSchema: projectsOutputSchema,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 50', required: false, defaultValue: 50 }),
    offset: Property.Number({ displayName: 'Offset', description: 'Use nextOffset from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 50 });
    const offset = posthogClient.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000, fallback: 0 });
    const connectionProject = String(auth.props.project_id).trim();
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: '/api/organizations/@current/projects/',
      query: { limit, offset },
    });
    return posthogMappers.page({
      body,
      offset,
      map: (raw) => {
        const r = posthogClient.recordOf(raw);
        const id = posthogClient.num(r['id']);
        return {
          id,
          name: posthogClient.str(r['name']),
          organizationId: posthogClient.str(r['organization']),
          timezone: posthogClient.str(r['timezone']),
          isCurrentConnection: id !== null && String(id) === connectionProject,
          createdAt: posthogClient.str(r['created_at']),
        };
      },
    });
  },
});
