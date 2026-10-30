import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabProps } from '../../common/props';
import { archiveProject } from '../../common/irreversible';
import { projectOutputSchema } from '../../output-schemas-admin';

export const archiveProjectAction = createAction({
  auth: gitlabAuth,
  name: 'archive_project',
  displayName: 'Archive Project',
  description: 'Archives a project, making it read-only.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Archives a GitLab project: it becomes read-only (no pushes, issues, merge requests or pipelines) and is hidden from default lists. Requires Maintainer or Owner role. Archiving an archived project changes nothing. Undo with Unarchive Project.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectOutputSchema,
  async run({ auth, propsValue }) {
    return archiveProject({ auth, projectId: propsValue.projectId });
  },
});
