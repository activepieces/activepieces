import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findTask = createAction({
  auth: meistertaskAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds a task by searching',
  props: {
    section_id: Property.ShortText({
      displayName: 'Section ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: false,
    }),
  },
  
  async run(context) {
    const { section_id, name } = context.propsValue;
    
    const tasks = await meisterTaskCommon.makeRequest<Array<unknown>>(
      HttpMethod.GET,
      `/sections/${section_id}/tasks`,
      context.auth.access_token
    );
    
    if (name) {
      return tasks.find((task: any) => task.name === name) || null;
    }
    
    return tasks;
  },
});
