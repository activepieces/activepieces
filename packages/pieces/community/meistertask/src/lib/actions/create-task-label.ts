import { meistertaskAuth } from '../../index';
import { meisterTaskCommon, makeRequest} from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_task_label',
  displayName: 'Create Task Label',
  description: 'Creates a new task label',
  props: {
    project: meisterTaskCommon.project,
    task_id: Property.Number({
      displayName: 'Task ID',
      required: true,
    }),
    label: meisterTaskCommon.label,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, label } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/labels`,
      token,
      { label_id: label }
    );

    return response.body;
  },
});
