import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluInput, flowluSharedProps } from '../../common/utils';
import { projectOutputSchema } from '../../output-schemas';

export const flowluProjectUpdate = createAction({
  auth: flowluAuth,
  name: 'flowlu_project_update',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates fields on a Flowlu project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you pass on one Flowlu project, identified by project_id; omitted fields keep their value. Use to rename, reschedule, reassign the manager, change the customer, or archive/unarchive the project (is_archive). Requires at least one field. Idempotent: repeating the same update leaves the project unchanged.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Numeric ID of the project, such as "42". Get it from flowlu_find_projects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New project name.',
      required: false,
    }),
    ...flowluAiProps.project(),
    is_archive: flowluSharedProps.triState({
      displayName: 'Archived',
      description:
        'Yes archives the project, No restores it. Leave empty to keep it as is.',
    }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.project_id,
      name: 'Project ID',
    });
    const body = flowluAiBody.project(context.propsValue);
    if (Object.keys(body).length === 0) {
      throw new FlowluApiError({
        message: 'Nothing to update: pass at least one field to change.',
      });
    }
    return makeClient(context.auth).updateRecord('st', 'projects', id, body);
  },
});
