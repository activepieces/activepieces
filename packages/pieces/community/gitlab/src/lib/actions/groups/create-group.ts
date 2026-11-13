import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { optionalPositiveInt, optionalText, requireText } from '../../common/props';
import { groupOutputSchema } from '../../output-schemas-admin';

export const createGroupAction = createAction({
  auth: gitlabAuth,
  name: 'create_group',
  displayName: 'Create Group',
  description: 'Creates a group or a subgroup.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a GitLab group, or a subgroup when Parent Group ID is set. On gitlab.com new top-level groups usually cannot be created through the API, so create subgroups under a group where the connected user is Owner or Maintainer. A path already taken fails with 400.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    path: Property.ShortText({ displayName: 'Path', description: 'URL slug, e.g. my-team.', required: true }),
    parentId: Property.Number({ displayName: 'Parent Group ID', description: 'Numeric ID of the parent group, for a subgroup.', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    visibility: adminProps.visibility('Leave empty for the GitLab default. A subgroup cannot be more visible than its parent.'),
  },
  outputSchema: groupOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth, 
      method: 'POST',
      path: '/groups',
      body: {
        name: requireText({ value: propsValue.name, label: 'Name' }),
        path: requireText({ value: propsValue.path, label: 'Path' }),
        parent_id: optionalPositiveInt({ value: propsValue.parentId, label: 'Parent Group ID' }),
        description: optionalText(propsValue.description),
        visibility: propsValue.visibility ?? undefined,
      },
    });
  },
});
