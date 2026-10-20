import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListTaskStagesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_task_stages',
  classification: 'SEARCH',
  displayName: 'List Task Stages',
  description: 'List the task stages of a project type.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the task stages (kanban columns) of a project type, or of the default project type when no id is given, with their id, label and completion and approval flags. Use to get a stage label for Create Task or a stage id for Update Task and List Tasks. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.taskStageList,
  props: {
    projectTypeId: Property.ShortText({
      displayName: 'Project Type ID',
      description: 'Project type id, from List Project Types or a project record. Leave empty for the default project type.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/taskStages/list',
      query: { projectTypeId: moxieInput.optionalId({ value: propsValue.projectTypeId, field: 'Project Type ID' }) },
    });
  },
});
