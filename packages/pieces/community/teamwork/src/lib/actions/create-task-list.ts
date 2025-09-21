import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createTaskListAction = createAction({
  auth: teamworkAuth,
  name: 'create_task_list',
  displayName: 'Create Task List',
  description: 'Add a new task list under a project.',
  props: {
    project_id: teamworkProps.project_id(true),
    name: Property.ShortText({
      displayName: 'Task List Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    addToTop: Property.Checkbox({
      displayName: 'Add to Top',
      description: 'Place the new task list at the top of the list.',
      required: false,
      defaultValue: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Mark the task list as private.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, name, description, addToTop, private: isPrivate } = propsValue;

    const taskListData = {
      name: name,
      description: description,
      private: isPrivate,
      'add-to-top': addToTop,
    };

    return await teamworkClient.createTaskList(auth as TeamworkAuth, project_id as string, taskListData);
  },
});