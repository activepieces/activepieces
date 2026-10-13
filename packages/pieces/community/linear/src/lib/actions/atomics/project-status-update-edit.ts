import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearProjectStatusUpdateNode, linearMappers } from '../../common/mappers';
import { atomicProps } from './common';
import { PROJECT_STATUS_UPDATE_EDIT_MUTATION } from './queries';
import { atomicProjectStatusUpdateOutputSchema } from './output-schemas';

export const linearProjectStatusUpdateEditAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_update_edit',
  classification: 'WRITE',
  displayName: 'Edit Project Status Update (AI)',
  description: 'Change the text or health of a posted project status update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a posted Linear project status update: replaces its markdown body and/or changes its health; whatever you leave out stays as it is. This edits the progress report, not the project (use Update Project for that). Idempotent: repeating the same edit leaves the update unchanged.',
    idempotent: true,
  },
  props: {
    status_update_id: Property.ShortText({ displayName: 'Status Update ID', description: 'UUID of the project status update.', required: true }),
    body: Property.LongText({ displayName: 'Body', description: 'New update text in Markdown. Replaces the whole body.', required: false }),
    health: atomicProps.healthProp({ description: 'New health. Leave empty to keep the current one.' }),
  },
  outputSchema: atomicProjectStatusUpdateOutputSchema,
  async run({ auth, propsValue }) {
    const input = linearGraphql.definedOnly({ body: propsValue.body, health: propsValue.health });
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: pass a new body or health.');
    }
    const data = await linearGraphql.request<{
      projectUpdateUpdate: { success: boolean; projectUpdate: LinearProjectStatusUpdateNode };
    }>({
      auth,
      query: PROJECT_STATUS_UPDATE_EDIT_MUTATION,
      variables: { id: propsValue.status_update_id.trim(), input },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.projectUpdateUpdate, what: 'status update edit' });
    return linearMappers.flattenProjectStatusUpdate(payload.projectUpdate);
  },
});
