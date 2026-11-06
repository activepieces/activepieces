import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { GitlabAuthValue, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { GitlabApiError } from '../../common/secret-request';
import { projectStarOutputSchema } from '../../output-schemas-admin';

type StarredProject = { id: number; path_with_namespace: string; star_count: number };

export async function toggleStar({ auth, projectId, verb }: { auth: GitlabAuthValue; projectId: string; verb: 'star' | 'unstar' }) {
  const path = projectPath(projectId);
  let project: StarredProject;
  let unchanged = false;
  try {
    project = await gitlabRequest<StarredProject>({ auth,  method: 'POST', path: `${path}/${verb}` });
  } catch (error) {
    if (!(error instanceof GitlabApiError) || error.status !== 304) {
      throw error;
    }
    unchanged = true;
    project = await gitlabRequest<StarredProject>({ auth,  method: 'GET', path });
  }
  return {
    starred: verb === 'star',
    unchanged,
    projectId: project.id,
    path_with_namespace: project.path_with_namespace,
    star_count: project.star_count,
  };
}

export const starProjectAction = createAction({
  auth: gitlabAuth,
  name: 'star_project',
  displayName: 'Star Project',
  description: 'Stars a project for the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Stars a GitLab project for the connected user. If it is already starred the call succeeds with unchanged true. Undo with Unstar Project.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectStarOutputSchema,
  async run({ auth, propsValue }) {
    return toggleStar({ auth, projectId: propsValue.projectId, verb: 'star' });
  },
});
