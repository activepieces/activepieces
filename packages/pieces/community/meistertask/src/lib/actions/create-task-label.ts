import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_task_label',
  displayName: 'Add Label to Task',
  description: 'Adds a label to a task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    task_id: meisterTaskCommon.task_id,
    label: meisterTaskCommon.label,
  },
  async run(context) {
    const token = getAccessToken(context.auth);
    const { task_id, label } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/labels`,
      token,
      {
        label_id: label,
      }
    );

    return response.body;
  },
});
