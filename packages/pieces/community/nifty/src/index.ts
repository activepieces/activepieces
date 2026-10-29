import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { completeTask } from './lib/actions/complete-task';
import { deleteTask } from './lib/actions/delete-task';
import { getTask } from './lib/actions/get-task';
import { findTasks } from './lib/actions/find-tasks';
import { addTaskAssignees } from './lib/actions/add-task-assignees';
import { removeTaskAssignees } from './lib/actions/remove-task-assignees';
import { createProject } from './lib/actions/create-project';
import { updateProject } from './lib/actions/update-project';
import { getProject } from './lib/actions/get-project';
import { findProjects } from './lib/actions/find-projects';
import { createMilestone } from './lib/actions/create-milestone';
import { listStatuses } from './lib/actions/list-statuses';
import { listMilestones } from './lib/actions/list-milestones';
import { listMembers } from './lib/actions/list-members';
import { niftyTaskCreate } from './lib/actions/ai/task-create';
import { niftyTaskUpdate } from './lib/actions/ai/task-update';
import { niftyProjectCreate } from './lib/actions/ai/project-create';
import { niftyProjectUpdate } from './lib/actions/ai/project-update';
import { niftyMilestoneCreate } from './lib/actions/ai/milestone-create';
import { newTask } from './lib/triggers/new-task';
import { taskCompleted } from './lib/triggers/task-completed';
import { newProject } from './lib/triggers/new-project';
import { niftyAuth } from './lib/auth';
import { niftyClient } from './lib/common/client';

export const nifty = createPiece({
  displayName: 'Nifty',
  description: 'Project management made simple',
  auth: niftyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/nifty.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getTask,
    findTasks,
    addTaskAssignees,
    removeTaskAssignees,
    createProject,
    updateProject,
    getProject,
    findProjects,
    createMilestone,
    listStatuses,
    listMilestones,
    listMembers,
    niftyTaskCreate,
    niftyTaskUpdate,
    niftyProjectCreate,
    niftyProjectUpdate,
    niftyMilestoneCreate,
    createCustomApiCallAction({
      baseUrl: () => niftyClient.BASE_URL,
      auth: niftyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newTask, taskCompleted, newProject],
});
