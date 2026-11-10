import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalPositiveInt, optionalText } from '../../common/props';
import { projectOutputSchema } from '../../output-schemas-admin';

export const forkProjectAction = createAction({
  auth: gitlabAuth,
  name: 'fork_project',
  displayName: 'Fork Project',
  description: 'Forks a project into your namespace or a group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Forks a GitLab project into the connected user namespace or a target group. The copy runs in the background: the result has import_status (scheduled, started, finished); poll Get Project on the new ID until it is finished. A second fork into the same namespace with the same path fails.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId('Numeric ID or full path of the project to fork.'),
    namespaceId: Property.Number({ displayName: 'Target Namespace ID', description: 'Numeric ID of the group to fork into. Empty = your personal namespace.', required: false }),
    namespacePath: Property.ShortText({ displayName: 'Target Namespace Path', description: 'Full path of the group to fork into. Use instead of Target Namespace ID.', required: false }),
    name: Property.ShortText({ displayName: 'New Name', required: false }),
    path: Property.ShortText({ displayName: 'New Path', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    visibility: adminProps.visibility('Leave empty to copy the source visibility.'),
  },
  outputSchema: projectOutputSchema,
  async run({ auth, propsValue }) {
    const namespaceId = optionalPositiveInt({ value: propsValue.namespaceId, label: 'Target Namespace ID' });
    const namespacePath = optionalText(propsValue.namespacePath);
    if (namespaceId !== undefined && namespacePath !== undefined) {
      throw new Error('Set either Target Namespace ID or Target Namespace Path, not both.');
    }
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/fork`,
      body: {
        namespace_id: namespaceId,
        namespace_path: namespacePath,
        name: optionalText(propsValue.name),
        path: optionalText(propsValue.path),
        description: optionalText(propsValue.description),
        visibility: propsValue.visibility ?? undefined,
      },
    });
  },
});
