import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getTasks } from '../api';
import { projectDropdown } from '../common/props';

export const findTaskAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds tasks in a project',
  props: {
    project_id: projectDropdown,
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the task to search for (leave empty to get all tasks)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, name } = propsValue;
    
    const tasks = await getTasks(auth, project_id);
    
    if (name && typeof name === 'string' && name.trim().length > 0) {
      const filteredTasks = tasks.filter((t: any) => 
        t.name && t.name.toLowerCase().includes(name.trim().toLowerCase())
      );
      return {
        success: true,
        tasks: filteredTasks,
        count: filteredTasks.length,
      };
    }
    
    return {
      success: true,
      tasks,
      count: tasks.length,
    };
  },
});
