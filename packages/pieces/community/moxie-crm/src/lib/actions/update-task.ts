import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateTaskAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Update a task, move it to another stage or change its assignees. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates a Moxie task picked by client, project and task, including its stage and assignees; only filled fields change. For agents use moxie_task_update. Idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.task,
  props: {
    clientName: moxieDropdowns.clientName({ required: true }),
    projectId: moxieDropdowns.projectByClientName({ required: true, valueKey: 'id' }),
    taskId: moxieDropdowns.taskIdByProject({ required: true }),
    statusId: moxieDropdowns.taskStageIdByProject({ required: false }),
    assignedToList: moxieDropdowns.userIds({
      required: false,
      description: 'Replaces the current assignees. Leave empty to keep them.',
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.taskUpdate, audience: 'human' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.taskUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateTask({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
