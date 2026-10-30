import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { requireColor } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { labelOutputSchema } from '../../output-schemas-admin';

export function optionalPriority(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Priority must be a whole number of 0 or more.');
  }
  return parsed;
}

export const createLabelAction = createAction({
  auth: gitlabAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a label in a project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a project label with a name and color, optionally a description and priority. A label with the same name already in the project fails with 409; check List Labels first. Apply labels to issues with Update Issue.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color such as #FF0000, or a CSS color name.', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: 'Whole number, 0 or more; lower sorts first. Empty = no priority.', required: false }),
  },
  outputSchema: labelOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/labels`,
      body: {
        name: requireText({ value: propsValue.name, label: 'Name' }),
        color: requireColor({ value: propsValue.color, label: 'Color' }),
        description: optionalText(propsValue.description),
        priority: optionalPriority(propsValue.priority),
      },
      statusMessages: { 409: 'A label with this name already exists in the project' },
    });
  },
});
