import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearProjectStatusUpdateNode, linearMappers } from '../../common/mappers';
import { PROJECT_STATUS_UPDATE_CREATE_MUTATION } from '../../common/queries';
import { atomicProps } from './common';
import { atomicProjectStatusUpdateOutputSchema } from './output-schemas';

export const linearProjectStatusUpdateCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_update_create',
  classification: 'WRITE',
  displayName: 'Post Project Status Update (AI)',
  description: 'Post a progress report (status update with health) on a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a project status update, the progress report in a Linear project\'s Updates tab: a markdown body with an optional health of onTrack, atRisk or offTrack. This does not edit the project; use Update Project for its fields. Not idempotent: each call posts another update.',
    idempotent: false,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'UUID of the project (from List Projects).', required: true }),
    body: Property.LongText({ displayName: 'Body', description: 'Update text in Markdown.', required: true }),
    health: atomicProps.healthProp({ description: 'onTrack, atRisk or offTrack. Leave empty for no health rating.' }),
  },
  outputSchema: atomicProjectStatusUpdateOutputSchema,
  async run({ auth, propsValue }) {
    if (propsValue.body.trim().length === 0) {
      throw new Error('Body cannot be empty.');
    }
    const data = await linearGraphql.request<{
      projectUpdateCreate: { success: boolean; projectUpdate: LinearProjectStatusUpdateNode };
    }>({
      auth,
      query: PROJECT_STATUS_UPDATE_CREATE_MUTATION,
      variables: {
        input: linearGraphql.definedOnly({
          projectId: propsValue.project_id.trim(),
          body: propsValue.body,
          health: propsValue.health,
        }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.projectUpdateCreate, what: 'project status update' });
    return linearMappers.flattenProjectStatusUpdate(payload.projectUpdate);
  },
});

