import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { apiRequest } from '../api';
import { projectDropdown, taskDropdown, labelDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskLabelAction = createAction({
  auth: meisterTaskAuth,
  name: 'create_task_label',
  displayName: 'Create Task Label',
  description: 'Assigns a label to a task',
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
    label_id: {
      ...labelDropdown,
      required: true,
      displayName: 'Label',
    },
  },
  async run({ auth, propsValue }) {
    const { task_id, label_id } = propsValue;
    
    if (!label_id) {
      throw new Error('Label is required');
    }

    const result = await apiRequest<any>(auth, HttpMethod.POST, `/tasks/${task_id}/task_labels`, { label_id });
    return result;
  },
});
