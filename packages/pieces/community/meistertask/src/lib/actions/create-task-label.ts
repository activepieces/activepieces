import { meistertaskAuth } from '../../index';
import {  makeRequest, meisterTaskCommon} from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_task_label',
  displayName: 'Create Task Label',
  description: 'Creates a new task label',
  props: {
    project: meisterTaskCommon.project,
    task_id: meisterTaskCommon.task_id,
    label: meisterTaskCommon.label,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, label } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/task_labels`,
      token,
      { label_id: label }
    );

    return response.body;
  },
});
