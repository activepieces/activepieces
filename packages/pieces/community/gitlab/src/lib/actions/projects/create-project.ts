import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { optionalPositiveInt, optionalText } from '../../common/props';
import { projectOutputSchema } from '../../output-schemas-admin';

export const createProjectAction = createAction({
  auth: gitlabAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in your namespace or in a group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a new GitLab project (repository) in the connected user namespace, or in a group when Namespace ID is set. Give a name, a path or both. Each call creates another project; a name or path already taken fails with 400. Visibility follows the GitLab default when empty.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Display name. Required unless Path is set.', required: false }),
    path: Property.ShortText({ displayName: 'Path', description: 'URL slug. Defaults to the name.', required: false }),
    namespaceId: Property.Number({ displayName: 'Namespace ID', description: 'Numeric ID of the group to create the project in (Get Group returns it). Empty = your personal namespace.', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    visibility: adminProps.visibility('Leave empty for the GitLab default.'),
    initializeWithReadme: Property.Checkbox({ displayName: 'Initialize With README', description: 'Create a first commit with a README.', required: false, defaultValue: false }),
    defaultBranch: Property.ShortText({ displayName: 'Default Branch', description: 'Only applied together with Initialize With README.', required: false }),
  },
  outputSchema: projectOutputSchema,
  async run({ auth, propsValue }) {
    const name = optionalText(propsValue.name);
    const path = optionalText(propsValue.path);
    if (name === undefined && path === undefined) {
      throw new Error('Set a Name or a Path for the new project.');
    }
    return gitlabRequest({ auth, 
      method: 'POST',
      path: '/projects',
      body: {
        name,
        path,
        namespace_id: optionalPositiveInt({ value: propsValue.namespaceId, label: 'Namespace ID' }),
        description: optionalText(propsValue.description),
        visibility: propsValue.visibility ?? undefined,
        initialize_with_readme: propsValue.initializeWithReadme === true ? true : undefined,
        default_branch: propsValue.initializeWithReadme === true ? optionalText(propsValue.defaultBranch) : undefined,
      },
    });
  },
});

