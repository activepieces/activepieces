import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { LinearProjectStatusUpdateNode, linearMappers } from '../../common/mappers';
import { PROJECT_STATUS_UPDATE_CREATE_MUTATION } from '../../common/queries';
import { projectStatusUpdateOutputSchema } from '../../output-schemas';

export const linearCreateProjectStatusUpdate = createAction({
  auth: linearAuth,
  name: 'linear_create_project_status_update',
  classification: 'WRITE',
  displayName: 'Post Project Status Update',
  description: 'Post a status update (with health) on a project, like the weekly update in the project page',
  audience: 'human',
  aiMetadata: {
    description:
      'Posts a status update on a Linear project: a markdown body plus an optional health of on track, at risk or off track, shown in the project Updates tab. This does not change the project itself; use Update Project to edit its name, dates or status. Not idempotent: each call posts a new update.',
    idempotent: false,
  },
  props: {
    team_id: props.team_id(),
    project_id: props.project_id(),
    body: Property.LongText({
      displayName: 'Update',
      description: 'The update text. Markdown is supported.',
      required: true,
    }),
    health: props.project_health(false),
  },
  outputSchema: projectStatusUpdateOutputSchema,
  async run({ auth, propsValue }) {
    const projectId = propsValue.project_id;
    if (!projectId) {
      throw new Error('Select a project.');
    }
    const data = await linearGraphql.request<{
      projectUpdateCreate: { success: boolean; projectUpdate: LinearProjectStatusUpdateNode };
    }>({
      auth,
      query: PROJECT_STATUS_UPDATE_CREATE_MUTATION,
      variables: {
        input: linearGraphql.definedOnly({
          projectId,
          body: propsValue.body,
          health: propsValue.health,
        }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.projectUpdateCreate, what: 'project status update' });
    return linearMappers.flattenProjectStatusUpdate(payload.projectUpdate);
  },
});
