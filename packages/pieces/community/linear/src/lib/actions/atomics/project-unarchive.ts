import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearArchivedProjectNode } from './common';
import { PROJECT_UNARCHIVE_MUTATION } from './queries';
import { atomicArchivedProjectOutputSchema } from './output-schemas';

export const linearProjectUnarchiveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_unarchive',
  classification: 'WRITE',
  displayName: 'Restore Project (AI)',
  description: 'Restore a trashed or archived project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores a Linear project that was deleted (trashed) or archived, bringing it back to active views. Use to undo Delete Project. Idempotent: restoring an active project leaves it active.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
  },
  outputSchema: atomicArchivedProjectOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{
      projectUnarchive: { success: boolean; entity: LinearArchivedProjectNode | null };
    }>({ auth, query: PROJECT_UNARCHIVE_MUTATION, variables: { id: propsValue.project_id.trim() } });
    const payload = linearGraphql.requireSuccess({ payload: data.projectUnarchive, what: 'project restore' });
    return atomicMappers.flattenArchivedProject(payload.entity);
  },
});
