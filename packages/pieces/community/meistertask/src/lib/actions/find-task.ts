import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findTask = createAction({
  auth: meistertaskAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds a task by searching',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    name: Property.ShortText({
      displayName: 'Task Name',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section, name } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.GET,
      `/sections/${section}/tasks`,
      token
    );

    let tasks = response.body;

    if (name) {
      tasks = tasks.filter((task: any) =>
        task.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    return tasks.length > 0 ? tasks[0] : null;
  },
});