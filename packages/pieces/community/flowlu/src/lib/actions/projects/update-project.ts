import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluAiBody } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluProjectProps } from '../../common/project-props';
import { flowluInput } from '../../common/utils';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates an existing project.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on an existing Flowlu project picked from a list, including archiving it. Only filled fields are sent. For agents use flowlu_project_update. Idempotent: repeating the same update leaves the project unchanged.',
    idempotent: true,
  },
  props: {
    project_id: flowluCommon.project_id(true, 'Project'),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    ...flowluProjectProps.fields(),
    is_archive: Property.StaticDropdown({
      displayName: 'Archived',
      description:
        'Archive or restore the project. Leave empty to keep it as is.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Archive', value: 'yes' },
          { label: 'Restore (not archived)', value: 'no' },
        ],
      },
    }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.project_id,
      name: 'Project',
    });
    const body = flowluAiBody.project(context.propsValue);
    if (Object.keys(body).length === 0) {
      throw new FlowluApiError({
        message: 'Nothing to update: fill at least one field to change.',
      });
    }
    return makeClient(context.auth).updateRecord('st', 'projects', id, body);
  },
});
