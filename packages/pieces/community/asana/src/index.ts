import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { asanaCreateTaskAction } from './lib/actions/create-task';
import { asanaGetCurrentUserAction } from './lib/actions/ai/get-current-user';
import { asanaListWorkspacesAction } from './lib/actions/ai/list-workspaces';
import { asanaListTeamsAction } from './lib/actions/ai/list-teams';
import { asanaSearchWorkspaceObjectsAction } from './lib/actions/ai/search-workspace-objects';
import { asanaCreateProjectTaskAction } from './lib/actions/ai/create-project-task';
import { asanaGetTaskAction } from './lib/actions/ai/get-task';
import { asanaUpdateTaskAction } from './lib/actions/ai/update-task';
import { asanaDeleteTaskAction } from './lib/actions/ai/delete-task';
import { asanaDuplicateTaskAction } from './lib/actions/ai/duplicate-task';
import { asanaGetJobAction } from './lib/actions/ai/get-job';
import { asanaListAssignedTasksAction } from './lib/actions/ai/list-assigned-tasks';
import { asanaListProjectTasksAction } from './lib/actions/ai/list-project-tasks';
import { asanaListSubtasksAction } from './lib/actions/ai/list-subtasks';
import { asanaCreateSubtaskAction } from './lib/actions/ai/create-subtask';
import { asanaSetTaskParentAction } from './lib/actions/ai/set-task-parent';
import { asanaListTaskProjectsAction } from './lib/actions/ai/list-task-projects';
import { asanaAddTaskToProjectAction } from './lib/actions/ai/add-task-to-project';
import { asanaRemoveTaskFromProjectAction } from './lib/actions/ai/remove-task-from-project';
import { asanaAddTaskFollowersAction } from './lib/actions/ai/add-task-followers';
import { asanaRemoveTaskFollowersAction } from './lib/actions/ai/remove-task-followers';
import { asanaAddTaskCommentAction } from './lib/actions/ai/add-task-comment';
import { asanaListTaskStoriesAction } from './lib/actions/ai/list-task-stories';
import { asanaGetStoryAction } from './lib/actions/ai/get-story';
import { asanaUpdateCommentAction } from './lib/actions/ai/update-comment';
import { asanaDeleteCommentAction } from './lib/actions/ai/delete-comment';
import { asanaCreateProjectAction } from './lib/actions/ai/create-project';
import { asanaGetProjectAction } from './lib/actions/ai/get-project';
import { asanaListProjectsAction } from './lib/actions/ai/list-projects';
import { asanaUpdateProjectAction } from './lib/actions/ai/update-project';
import { asanaDeleteProjectAction } from './lib/actions/ai/delete-project';
import { asanaDuplicateProjectAction } from './lib/actions/ai/duplicate-project';
import { asanaGetProjectTaskCountsAction } from './lib/actions/ai/get-project-task-counts';
import { asanaAddProjectMembersAction } from './lib/actions/ai/add-project-members';
import { asanaRemoveProjectMembersAction } from './lib/actions/ai/remove-project-members';
import { asanaAddProjectFollowersAction } from './lib/actions/ai/add-project-followers';
import { asanaRemoveProjectFollowersAction } from './lib/actions/ai/remove-project-followers';
import { asanaCreateSectionAction } from './lib/actions/ai/create-section';
import { asanaGetSectionAction } from './lib/actions/ai/get-section';
import { asanaListSectionsAction } from './lib/actions/ai/list-sections';
import { asanaUpdateSectionAction } from './lib/actions/ai/update-section';
import { asanaDeleteSectionAction } from './lib/actions/ai/delete-section';
import { asanaMoveSectionAction } from './lib/actions/ai/move-section';
import { asanaMoveTaskToSectionAction } from './lib/actions/ai/move-task-to-section';
import { asanaListSectionTasksAction } from './lib/actions/ai/list-section-tasks';
import { asanaCreateMembershipAction } from './lib/actions/ai/create-membership';
import { asanaGetMembershipAction } from './lib/actions/ai/get-membership';
import { asanaListMembershipsAction } from './lib/actions/ai/list-memberships';
import { asanaDeleteMembershipAction } from './lib/actions/ai/delete-membership';
import { asanaCreateStatusUpdateAction } from './lib/actions/ai/create-status-update';
import { asanaGetStatusUpdateAction } from './lib/actions/ai/get-status-update';
import { asanaListStatusUpdatesAction } from './lib/actions/ai/list-status-updates';
import { asanaDeleteStatusUpdateAction } from './lib/actions/ai/delete-status-update';
import { asanaCreateProjectBriefAction } from './lib/actions/ai/create-project-brief';
import { asanaGetProjectBriefAction } from './lib/actions/ai/get-project-brief';
import { asanaUpdateProjectBriefAction } from './lib/actions/ai/update-project-brief';
import { asanaDeleteProjectBriefAction } from './lib/actions/ai/delete-project-brief';
import { asanaCreateTagAction } from './lib/actions/ai/create-tag';
import { asanaGetTagAction } from './lib/actions/ai/get-tag';
import { asanaListTagsAction } from './lib/actions/ai/list-tags';
import { asanaUpdateTagAction } from './lib/actions/ai/update-tag';
import { asanaDeleteTagAction } from './lib/actions/ai/delete-tag';
import { asanaListTaskTagsAction } from './lib/actions/ai/list-task-tags';
import { asanaAddTagToTaskAction } from './lib/actions/ai/add-tag-to-task';
import { asanaRemoveTagFromTaskAction } from './lib/actions/ai/remove-tag-from-task';
import { asanaListTagTasksAction } from './lib/actions/ai/list-tag-tasks';
import { asanaAuth } from './lib/auth';

export const asana = createPiece({
  displayName: 'Asana',
  description: "Work management platform designed to help teams organize, track, and manage their work.",
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["ShayPunter","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: asanaAuth,
  actions: [
    asanaCreateTaskAction,
    asanaGetCurrentUserAction,
    asanaListWorkspacesAction,
    asanaListTeamsAction,
    asanaSearchWorkspaceObjectsAction,
    asanaCreateProjectTaskAction,
    asanaGetTaskAction,
    asanaUpdateTaskAction,
    asanaDeleteTaskAction,
    asanaDuplicateTaskAction,
    asanaGetJobAction,
    asanaListAssignedTasksAction,
    asanaListProjectTasksAction,
    asanaListSubtasksAction,
    asanaCreateSubtaskAction,
    asanaSetTaskParentAction,
    asanaListTaskProjectsAction,
    asanaAddTaskToProjectAction,
    asanaRemoveTaskFromProjectAction,
    asanaAddTaskFollowersAction,
    asanaRemoveTaskFollowersAction,
    asanaAddTaskCommentAction,
    asanaListTaskStoriesAction,
    asanaGetStoryAction,
    asanaUpdateCommentAction,
    asanaDeleteCommentAction,
    asanaCreateProjectAction,
    asanaGetProjectAction,
    asanaListProjectsAction,
    asanaUpdateProjectAction,
    asanaDeleteProjectAction,
    asanaDuplicateProjectAction,
    asanaGetProjectTaskCountsAction,
    asanaAddProjectMembersAction,
    asanaRemoveProjectMembersAction,
    asanaAddProjectFollowersAction,
    asanaRemoveProjectFollowersAction,
    asanaCreateSectionAction,
    asanaGetSectionAction,
    asanaListSectionsAction,
    asanaUpdateSectionAction,
    asanaDeleteSectionAction,
    asanaMoveSectionAction,
    asanaMoveTaskToSectionAction,
    asanaListSectionTasksAction,
    asanaCreateMembershipAction,
    asanaGetMembershipAction,
    asanaListMembershipsAction,
    asanaDeleteMembershipAction,
    asanaCreateStatusUpdateAction,
    asanaGetStatusUpdateAction,
    asanaListStatusUpdatesAction,
    asanaDeleteStatusUpdateAction,
    asanaCreateProjectBriefAction,
    asanaGetProjectBriefAction,
    asanaUpdateProjectBriefAction,
    asanaDeleteProjectBriefAction,
    asanaCreateTagAction,
    asanaGetTagAction,
    asanaListTagsAction,
    asanaUpdateTagAction,
    asanaDeleteTagAction,
    asanaListTaskTagsAction,
    asanaAddTagToTaskAction,
    asanaRemoveTagFromTaskAction,
    asanaListTagTasksAction,
    createCustomApiCallAction({
      baseUrl: () => `https://app.asana.com/api/1.0`,
      auth: asanaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
