import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, LinearProjectStatusUpdateNode, linearMappers } from '../../common/mappers';
import { atomicProps } from './common';
import { PROJECT_STATUS_UPDATES_LIST_QUERY } from './queries';
import { atomicProjectStatusUpdatesPageOutputSchema } from './output-schemas';

export const linearProjectStatusUpdatesListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_updates_list',
  classification: 'SEARCH',
  displayName: 'List Project Status Updates (AI)',
  description: 'List project status updates, usually of one project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear project status updates (progress reports with health), normally for one project, one page at a time. Use to read how a project has been reported over time or to find an update ID to edit or archive. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'Only updates of this project (UUID from List Projects). Leave empty for all projects.', required: false }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    limit: atomicProps.limitProp({ fallback: 25, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicProjectStatusUpdatesPageOutputSchema,
  async run({ auth, propsValue }) {
    const project = atomicProps.idFilter(propsValue.project_id?.trim());
    const data = await linearGraphql.request<{ projectUpdates: LinearConnection<LinearProjectStatusUpdateNode> }>({
      auth,
      query: PROJECT_STATUS_UPDATES_LIST_QUERY,
      variables: {
        filter: project ? { project } : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 25, max: 250 }),
        after: propsValue.cursor || undefined,
        includeArchived: propsValue.include_archived === true,
      },
    });
    return linearMappers.toPage({ connection: data.projectUpdates, map: linearMappers.flattenProjectStatusUpdate });
  },
});
