import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { optionalText } from '../../common/props';
import { groupOutputSchema } from '../../output-schemas-admin';

export const updateGroupAction = createAction({
  auth: gitlabAuth,
  name: 'update_group',
  displayName: 'Update Group',
  description: 'Updates the name, path, description or visibility of a group. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes a GitLab group name, path, description or visibility. Only the fields you set are sent; use Clear Description to blank it. Changing the path changes the URL of the group and of every project in it. Requires the Owner role.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    path: Property.ShortText({ displayName: 'Path', description: 'New URL slug. Changes every project URL in the group.', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    visibility: adminProps.visibility('Leave empty to keep the current value.'),
  },
  outputSchema: groupOutputSchema,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    const name = optionalText(propsValue.name);
    if (name !== undefined) body['name'] = name;
    const path = optionalText(propsValue.path);
    if (path !== undefined) body['path'] = path;
    if (propsValue.clearDescription === true) body['description'] = '';
    else if (optionalText(propsValue.description) !== undefined) body['description'] = propsValue.description;
    if (propsValue.visibility) body['visibility'] = propsValue.visibility;
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    return gitlabRequest({ auth,  method: 'PUT', path: groupPath(propsValue.groupId), body });
  },
});
