import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { todoistCreateTaskAction } from './lib/actions/create-task-action';
import { todoistTaskCompletedTrigger } from './lib/triggers/task-completed-trigger';
import { todoistUpdateTaskAction } from './lib/actions/update-task.action';
import { todoistFindTaskAction } from './lib/actions/find-task.action';
import { todoistMarkTaskCompletedAction } from './lib/actions/mark-task-completed.action';
import { todoistCreateTaskAiAction } from './lib/actions/create-task.twin.action';
import { todoistUpdateTaskAiAction } from './lib/actions/update-task.twin.action';
import { todoistFindTaskAiAction } from './lib/actions/find-task.twin.action';
import { todoistCompleteTaskAiAction } from './lib/actions/complete-task.twin.action';
import { todoistFilterTasksAction } from './lib/actions/filter-tasks.action';
import { todoistDeleteTaskAction } from './lib/actions/delete-task.action';
import { todoistReopenTaskAction } from './lib/actions/reopen-task.action';
import { todoistMoveTaskAction } from './lib/actions/move-task.action';
import { todoistQuickAddTaskAction } from './lib/actions/quick-add-task.action';
import { todoistGetTaskAction } from './lib/actions/get-task.action';
import { todoistListCompletedTasksAction } from './lib/actions/list-completed-tasks.action';
import { todoistListCompletedTasksByDueDateAction } from './lib/actions/list-completed-tasks-by-due-date.action';
import { todoistCreateProjectAction } from './lib/actions/create-project.action';
import { todoistUpdateProjectAction } from './lib/actions/update-project.action';
import { todoistGetProjectAction } from './lib/actions/get-project.action';
import { todoistListProjectsAction } from './lib/actions/list-projects.action';
import { todoistSearchProjectsAction } from './lib/actions/search-projects.action';
import { todoistUnarchiveProjectAction } from './lib/actions/unarchive-project.action';
import { todoistListArchivedProjectsAction } from './lib/actions/list-archived-projects.action';
import { todoistCreateSectionAction } from './lib/actions/create-section.action';
import { todoistUpdateSectionAction } from './lib/actions/update-section.action';
import { todoistGetSectionAction } from './lib/actions/get-section.action';
import { todoistDeleteSectionAction } from './lib/actions/delete-section.action';
import { todoistListSectionsAction } from './lib/actions/list-sections.action';
import { todoistSearchSectionsAction } from './lib/actions/search-sections.action';
import { todoistListArchivedSectionsAction } from './lib/actions/list-archived-sections.action';
import { todoistCreateLabelAction } from './lib/actions/create-label.action';
import { todoistUpdateLabelAction } from './lib/actions/update-label.action';
import { todoistGetLabelAction } from './lib/actions/get-label.action';
import { todoistDeleteLabelAction } from './lib/actions/delete-label.action';
import { todoistListLabelsAction } from './lib/actions/list-labels.action';
import { todoistSearchLabelsAction } from './lib/actions/search-labels.action';
import { todoistListSharedLabelsAction } from './lib/actions/list-shared-labels.action';
import { todoistRenameSharedLabelAction } from './lib/actions/rename-shared-label.action';
import { todoistRemoveSharedLabelAction } from './lib/actions/remove-shared-label.action';
import { todoistCreateTaskCommentAction } from './lib/actions/create-task-comment.action';
import { todoistCreateProjectCommentAction } from './lib/actions/create-project-comment.action';
import { todoistGetCommentAction } from './lib/actions/get-comment.action';
import { todoistListCommentsAction } from './lib/actions/list-comments.action';
import { todoistGetCurrentUserAction } from './lib/actions/get-current-user.action';
import { todoistGetProductivityStatsAction } from './lib/actions/get-productivity-stats.action';
import { todoistListActivityLogAction } from './lib/actions/list-activity-log.action';

export const todoistAuth = PieceAuth.OAuth2({
	required: true,
	authUrl: 'https://todoist.com/oauth/authorize',
	tokenUrl: 'https://todoist.com/oauth/access_token',
	scope: ['data:read_write'],
});

export const todoist = createPiece({
	displayName: 'Todoist',
	description: 'To-do list and task manager',
	minimumSupportedRelease: '0.5.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/todoist.png',
	authors: ['MyWay', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud','sanket-a11y'],
	categories: [PieceCategory.PRODUCTIVITY],
	auth: todoistAuth,
	actions: [
		todoistCreateTaskAction,
		todoistUpdateTaskAction,
		todoistFindTaskAction,
		todoistMarkTaskCompletedAction,
		todoistCreateTaskAiAction,
		todoistUpdateTaskAiAction,
		todoistFindTaskAiAction,
		todoistCompleteTaskAiAction,
		todoistFilterTasksAction,
		todoistDeleteTaskAction,
		todoistReopenTaskAction,
		todoistMoveTaskAction,
		todoistQuickAddTaskAction,
		todoistGetTaskAction,
		todoistListCompletedTasksAction,
		todoistListCompletedTasksByDueDateAction,
		todoistCreateProjectAction,
		todoistUpdateProjectAction,
		todoistGetProjectAction,
		todoistListProjectsAction,
		todoistSearchProjectsAction,
		todoistUnarchiveProjectAction,
		todoistListArchivedProjectsAction,
		todoistCreateSectionAction,
		todoistUpdateSectionAction,
		todoistGetSectionAction,
		todoistDeleteSectionAction,
		todoistListSectionsAction,
		todoistSearchSectionsAction,
		todoistListArchivedSectionsAction,
		todoistCreateLabelAction,
		todoistUpdateLabelAction,
		todoistGetLabelAction,
		todoistDeleteLabelAction,
		todoistListLabelsAction,
		todoistSearchLabelsAction,
		todoistListSharedLabelsAction,
		todoistRenameSharedLabelAction,
		todoistRemoveSharedLabelAction,
		todoistCreateTaskCommentAction,
		todoistCreateProjectCommentAction,
		todoistGetCommentAction,
		todoistListCommentsAction,
		todoistGetCurrentUserAction,
		todoistGetProductivityStatsAction,
		todoistListActivityLogAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.todoist.com/api/v1',
			auth: todoistAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.access_token}`,
			}),
		}),
	],
	triggers: [todoistTaskCompletedTrigger],
});
