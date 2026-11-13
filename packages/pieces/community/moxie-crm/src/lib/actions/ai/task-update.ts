import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieTaskUpdateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_task_update',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates fields on an existing Moxie task, including its stage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Moxie task by id: rename, change description, dates or priority, move it to another stage with Stage ID, or replace its assignees. Only the fields you pass change. Use after finding the task id with Search Tasks or List Tasks. Idempotent: repeating the same update leaves the task unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.task,
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'Id of the task to update, from Search Tasks, List Tasks or a task trigger.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.taskUpdate, audience: 'ai' }),
    statusId: Property.ShortText({
      displayName: 'Stage ID',
      description: 'Moves the task to this stage id, from List Task Stages or List Project Types. Leave empty to keep the stage.',
      required: false,
    }),
    assignedToList: Property.Array({
      displayName: 'Assignee User IDs',
      description: 'Numeric user ids (user.userId from List Workspace Users). Replaces the current assignees.',
      required: false,
    }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.taskUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateTask({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
