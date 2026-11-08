import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, requireColor } from '../../common/admin';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalText } from '../../common/props';
import { labelOutputSchema } from '../../output-schemas-admin';
import { optionalPriority } from './create-label';

export const updateLabelAction = createAction({
  auth: gitlabAuth,
  name: 'update_label',
  displayName: 'Update Label',
  description: 'Renames or recolors a project label. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes a GitLab project label: new name, color, description or priority. Only the fields you set are sent; use the Clear options to remove the description or priority. Renaming updates the label on every issue and merge request that has it. Group labels cannot be changed here.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    labelId: adminProps.labelId(),
    newName: Property.ShortText({ displayName: 'New Name', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color such as #FF0000, or a CSS color name.', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    priority: Property.Number({ displayName: 'Priority', description: 'Whole number, 0 or more.', required: false }),
    clearPriority: Property.Checkbox({ displayName: 'Remove Priority', required: false, defaultValue: false }),
  },
  outputSchema: labelOutputSchema,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    const newName = optionalText(propsValue.newName);
    if (newName !== undefined) body['new_name'] = newName;
    if (optionalText(propsValue.color) !== undefined) body['color'] = requireColor({ value: propsValue.color, label: 'Color' });
    if (propsValue.clearDescription === true) body['description'] = '';
    else if (optionalText(propsValue.description) !== undefined) body['description'] = propsValue.description;
    if (propsValue.clearPriority === true) body['priority'] = null;
    else {
      const priority = optionalPriority(propsValue.priority);
      if (priority !== undefined) body['priority'] = priority;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    return gitlabRequest({ auth, 
      method: 'PUT',
      path: `${projectPath(propsValue.projectId)}/labels/${encodeSegment({ value: propsValue.labelId, label: 'Label ID or Name' })}`,
      body,
      statusMessages: { 409: 'A label with the new name already exists in the project' },
    });
  },
});
