import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearArchivedProjectNode } from './common';
import { PROJECT_DELETE_MUTATION } from './queries';
import { atomicArchivedProjectOutputSchema } from './output-schemas';

export const linearProjectDeleteAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project (AI)',
  description: 'Move a project to the trash. It can be restored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a Linear project to the trash; its issues are kept, and Restore Project brings it back. Use only when a project was created by mistake or is no longer wanted; to finish a project set its status with Update Project instead. Not idempotent: a second call on a trashed project may fail.',
    idempotent: false,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
  },
  outputSchema: atomicArchivedProjectOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{
      projectDelete: { success: boolean; entity: LinearArchivedProjectNode | null };
    }>({ auth, query: PROJECT_DELETE_MUTATION, variables: { id: propsValue.project_id.trim() } });
    const payload = linearGraphql.requireSuccess({ payload: data.projectDelete, what: 'project deletion' });
    return atomicMappers.flattenArchivedProject(payload.entity);
  },
});
