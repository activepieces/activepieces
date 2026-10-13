import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { addAgentKnowledgeProjectAction } from './lib/actions/add-agent-knowledge-project';
import { completeTaskByIdAction } from './lib/actions/ai/complete-task-by-id';
import { deleteTaskByIdAction } from './lib/actions/ai/delete-task-by-id';
import { askAgentAction } from './lib/actions/ask-agent';
import { assignTaskAction } from './lib/actions/assign-task';
import { completeProjectAction } from './lib/actions/complete-project';
import { completeTaskAction } from './lib/actions/complete-task.action';
import { copyProjectAction } from './lib/actions/copy-project';
import { createProjectAction } from './lib/actions/create-project';
import { createProjectFromTemplateAction } from './lib/actions/create-project-from-template';
import { createTaskAction } from './lib/actions/create-task.action';
import { createTasksAction } from './lib/actions/create-tasks';
import { deleteAgentAction } from './lib/actions/delete-agent';
import { deleteTaskAction } from './lib/actions/delete-task.action';
import { findTasksAction } from './lib/actions/find-tasks';
import { generateAgentAction } from './lib/actions/generate-agent';
import { getAgentAction } from './lib/actions/get-agent';
import { getAgentConversationAction } from './lib/actions/get-agent-conversation';
import { getProjectAction } from './lib/actions/get-project';
import { getProjectShareLinkAction } from './lib/actions/get-project-share-link';
import { getTaskAction } from './lib/actions/get-task';
import { listAgentConversationsAction } from './lib/actions/list-agent-conversations';
import { listAgentsAction } from './lib/actions/list-agents';
import { listFoldersAction } from './lib/actions/list-folders';
import { listProjectFieldsAction } from './lib/actions/list-project-fields';
import { listProjectMembersAction } from './lib/actions/list-project-members';
import { listProjectTemplatesAction } from './lib/actions/list-project-templates';
import { listProjectsAction } from './lib/actions/list-projects';
import { listRecentProjectsAction } from './lib/actions/list-recent-projects';
import { listTasksAction } from './lib/actions/list-tasks';
import { listWorkspacesAction } from './lib/actions/list-workspaces';
import { moveTaskAction } from './lib/actions/move-task';
import { removeAgentKnowledgeProjectAction } from './lib/actions/remove-agent-knowledge-project';
import { reopenTaskAction } from './lib/actions/reopen-task';
import { restoreProjectAction } from './lib/actions/restore-project';
import { setTaskDateAction } from './lib/actions/set-task-date';
import { setTaskFieldValueAction } from './lib/actions/set-task-field-value';
import { setTaskNoteAction } from './lib/actions/set-task-note';
import { triggerAutomationAction } from './lib/actions/trigger-automation';
import { unassignTaskAction } from './lib/actions/unassign-task';
import { updateTaskAction } from './lib/actions/update-task';
import { taskadeAuth } from './lib/auth';
import { taskadeApi, TASKADE_BASE_URL } from './lib/common/client';
import { commentCreatedTrigger } from './lib/triggers/comment-created';
import { projectAssignedTrigger } from './lib/triggers/project-assigned';
import { projectCreatedTrigger } from './lib/triggers/project-created';
import { projectJoinedTrigger } from './lib/triggers/project-joined';
import { taskAssignedTrigger } from './lib/triggers/task-assigned';
import { taskDueTrigger } from './lib/triggers/task-due';

export const taskade = createPiece({
	displayName: 'Taskade',
	auth: taskadeAuth,
	minimumSupportedRelease: '0.88.2',
	categories: [PieceCategory.PRODUCTIVITY],
	description: 'Collaboration platform for remote teams to organize projects, tasks and AI agents.',
	logoUrl: 'https://cdn.activepieces.com/pieces/taskade.png',
	authors: ['kishanprmr'],
	actions: [
		createTaskAction,
		completeTaskAction,
		deleteTaskAction,
		listWorkspacesAction,
		listFoldersAction,
		listProjectsAction,
		listRecentProjectsAction,
		getProjectAction,
		createProjectAction,
		createProjectFromTemplateAction,
		listProjectTemplatesAction,
		copyProjectAction,
		completeProjectAction,
		restoreProjectAction,
		listProjectMembersAction,
		listProjectFieldsAction,
		getProjectShareLinkAction,
		listTasksAction,
		findTasksAction,
		getTaskAction,
		createTasksAction,
		updateTaskAction,
		completeTaskByIdAction,
		reopenTaskAction,
		deleteTaskByIdAction,
		moveTaskAction,
		setTaskDateAction,
		setTaskNoteAction,
		assignTaskAction,
		unassignTaskAction,
		setTaskFieldValueAction,
		listAgentsAction,
		getAgentAction,
		askAgentAction,
		listAgentConversationsAction,
		getAgentConversationAction,
		generateAgentAction,
		deleteAgentAction,
		addAgentKnowledgeProjectAction,
		removeAgentKnowledgeProjectAction,
		triggerAutomationAction,
		createCustomApiCallAction({
			baseUrl: () => TASKADE_BASE_URL,
			auth: taskadeAuth,
			authMapping: async (auth) => taskadeApi.authHeaders(auth.secret_text),
		}),
	],
	triggers: [taskDueTrigger, taskAssignedTrigger, commentCreatedTrigger, projectCreatedTrigger, projectAssignedTrigger, projectJoinedTrigger],
});
