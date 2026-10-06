import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { completeTaskAction } from './lib/actions/complete-task';
import { createTaskAction } from './lib/actions/create-task';
import { deleteTaskAction } from './lib/actions/delete-task';
import { findTaskAction } from './lib/actions/find-task';
import { getProjectAction } from './lib/actions/get-project-by-id';
import { getTaskAction } from './lib/actions/get-task';
import { updateTaskAction } from './lib/actions/update-task';
import { listProjectsAction } from './lib/actions/ai/list-projects';
import { getProjectAiAction } from './lib/actions/ai/get-project';
import { getProjectDataAction } from './lib/actions/ai/get-project-data';
import { listProjectMembersAction } from './lib/actions/ai/list-project-members';
import { createProjectAction } from './lib/actions/ai/create-project';
import { updateProjectAction } from './lib/actions/ai/update-project';
import { deleteProjectAction } from './lib/actions/ai/delete-project';
import { listProjectGroupsAction } from './lib/actions/ai/list-project-groups';
import { createProjectGroupAction } from './lib/actions/ai/create-project-group';
import { updateProjectGroupAction } from './lib/actions/ai/update-project-group';
import { deleteProjectGroupAction } from './lib/actions/ai/delete-project-group';
import { listColumnsAction } from './lib/actions/ai/list-columns';
import { createColumnAction } from './lib/actions/ai/create-column';
import { updateColumnAction } from './lib/actions/ai/update-column';
import { getTaskAiAction } from './lib/actions/ai/get-task';
import { createTaskAiAction } from './lib/actions/ai/create-task';
import { updateTaskAiAction } from './lib/actions/ai/update-task';
import { completeTaskAiAction } from './lib/actions/ai/complete-task';
import { deleteTaskAiAction } from './lib/actions/ai/delete-task';
import { listTasksAction } from './lib/actions/ai/list-tasks';
import { searchTasksAction } from './lib/actions/ai/search-tasks';
import { listCompletedTasksAction } from './lib/actions/ai/list-completed-tasks';
import { listUndoneTasksAction } from './lib/actions/ai/list-undone-tasks';
import { completeTasksAction } from './lib/actions/ai/complete-tasks';
import { moveTasksAction } from './lib/actions/ai/move-tasks';
import { batchSaveTasksAction } from './lib/actions/ai/batch-save-tasks';
import { assignTaskAction } from './lib/actions/ai/assign-task';
import { unassignTaskAction } from './lib/actions/ai/unassign-task';
import { listTaskCommentsAction } from './lib/actions/ai/list-task-comments';
import { addTaskCommentAction } from './lib/actions/ai/add-task-comment';
import { deleteTaskCommentAction } from './lib/actions/ai/delete-task-comment';
import { listTagsAction } from './lib/actions/ai/list-tags';
import { createTagAction } from './lib/actions/ai/create-tag';
import { listCountdownsAction } from './lib/actions/ai/list-countdowns';
import { getUserPreferencesAction } from './lib/actions/ai/get-user-preferences';
import { listFocusesAction } from './lib/actions/ai/list-focuses';
import { getFocusAction } from './lib/actions/ai/get-focus';
import { createFocusAction } from './lib/actions/ai/create-focus';
import { deleteFocusAction } from './lib/actions/ai/delete-focus';
import { listHabitsAction } from './lib/actions/ai/list-habits';
import { listHabitSectionsAction } from './lib/actions/ai/list-habit-sections';
import { getHabitAction } from './lib/actions/ai/get-habit';
import { createHabitAction } from './lib/actions/ai/create-habit';
import { updateHabitAction } from './lib/actions/ai/update-habit';
import { checkinHabitAction } from './lib/actions/ai/checkin-habit';
import { listHabitCheckinsAction } from './lib/actions/ai/list-habit-checkins';
import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';
import { ticktickAuth } from './lib/auth';

export const ticktick = createPiece({
	displayName: 'TickTick',
	logoUrl: 'https://cdn.activepieces.com/pieces/ticktick.png',
	minimumSupportedRelease: '0.88.2',
	auth: ticktickAuth,
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		createTaskAction,
    updateTaskAction,
    getTaskAction,
    deleteTaskAction,
    completeTaskAction,
    findTaskAction,
    getProjectAction,
    listProjectsAction,
    getProjectAiAction,
    getProjectDataAction,
    listProjectMembersAction,
    createProjectAction,
    updateProjectAction,
    deleteProjectAction,
    listProjectGroupsAction,
    createProjectGroupAction,
    updateProjectGroupAction,
    deleteProjectGroupAction,
    listColumnsAction,
    createColumnAction,
    updateColumnAction,
    getTaskAiAction,
    createTaskAiAction,
    updateTaskAiAction,
    completeTaskAiAction,
    deleteTaskAiAction,
    listTasksAction,
    searchTasksAction,
    listCompletedTasksAction,
    listUndoneTasksAction,
    completeTasksAction,
    moveTasksAction,
    batchSaveTasksAction,
    assignTaskAction,
    unassignTaskAction,
    listTaskCommentsAction,
    addTaskCommentAction,
    deleteTaskCommentAction,
    listTagsAction,
    createTagAction,
    listCountdownsAction,
    getUserPreferencesAction,
    listFocusesAction,
    getFocusAction,
    createFocusAction,
    deleteFocusAction,
    listHabitsAction,
    listHabitSectionsAction,
    getHabitAction,
    createHabitAction,
    updateHabitAction,
    checkinHabitAction,
    listHabitCheckinsAction,
    createCustomApiCallAction({
      auth:ticktickAuth,
      baseUrl:()=>'https://api.ticktick.com/open/v1',
      authMapping:async (auth)=>{
        return {
          Authorization:`Bearer ${(auth).access_token}`
        }
      }
    })
	],
	triggers: [newTaskCreatedTrigger],
});
