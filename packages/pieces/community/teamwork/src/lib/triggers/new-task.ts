import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newTaskTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "id": 1,
    "canComplete": true,
    "content": "Test Task",
    "order": 1,
    "project-id": 1,
    "project-name": "Project 2",
    "todo-list-id": 1,
    "todo-list-name": "Task List - Added on 03 December",
    "status": "new",
    "company-name": "MCG Company",
    "company-id": 1,
    "creator-id": 1,
    "creator-firstname": "Holly",
    "creator-lastname": "Bracken",
    "completed": false,
    "created-on": "2024-12-12T10:06:31Z",
    "last-changed-on": "2024-12-12T10:06:31Z",
    "responsible-party-ids": "157302",
    "responsible-party-id": "157302",
    "responsible-party-names": "Roisin M.",
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const tasks = await teamworkClient.getTasks(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('tasks', tasks);
  },
  async onDisable(context) {
  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

    const newTasks = await teamworkClient.getTasks(auth, projectId as string);
    

    let latestTasks = newTasks;
    if (lastCheckDate) {
        latestTasks = newTasks.filter(task => {
            return new Date(task['created-on']) > new Date(lastCheckDate);
        });
    }


    if (latestTasks.length > 0) {

      await context.store.put('lastCheckDate', latestTasks[0]['created-on']);
    }
    
    return latestTasks;
  },
});