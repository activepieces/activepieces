import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { labelDropdown, projectDropdown, taskDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const createTaskLabel = createAction({
  auth: meisterTaskAuth,
  name: 'createTaskLabel',
  displayName: 'Create Task Label',
  description: 'Creates a new task label',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project',
      description: 'Select a project',
      required: true,
    }),
    labelId: labelDropdown({
      displayName: 'Select Label',
      description: 'Select a label',
      required: true,
    }),
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
  },
  async run(context) {
    return await meisterTaskApiService.createTaskLabels({
      auth: context.auth,
      taskId: context.propsValue.taskId,
      label_id: context.propsValue.labelId,
    });
  },
});
