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
import { asanaGetUserAction } from './lib/actions/ai/get-user';
import { asanaListUsersAction } from './lib/actions/ai/list-users';
import { asanaListFavoritesAction } from './lib/actions/ai/list-favorites';
import { asanaGetWorkspaceAction } from './lib/actions/ai/get-workspace';
import { asanaListWorkspaceMembershipsAction } from './lib/actions/ai/list-workspace-memberships';
import { asanaGetWorkspaceMembershipAction } from './lib/actions/ai/get-workspace-membership';
import { asanaAddUserToWorkspaceAction } from './lib/actions/ai/add-user-to-workspace';
import { asanaRemoveUserFromWorkspaceAction } from './lib/actions/ai/remove-user-from-workspace';
import { asanaCreateTeamAction } from './lib/actions/ai/create-team';
import { asanaGetTeamAction } from './lib/actions/ai/get-team';
import { asanaUpdateTeamAction } from './lib/actions/ai/update-team';
import { asanaListUserTeamsAction } from './lib/actions/ai/list-user-teams';
import { asanaAddUserToTeamAction } from './lib/actions/ai/add-user-to-team';
import { asanaRemoveUserFromTeamAction } from './lib/actions/ai/remove-user-from-team';
import { asanaListTeamMembershipsAction } from './lib/actions/ai/list-team-memberships';
import { asanaGetTeamMembershipAction } from './lib/actions/ai/get-team-membership';
import { asanaGetAttachmentAction } from './lib/actions/ai/get-attachment';
import { asanaListAttachmentsAction } from './lib/actions/ai/list-attachments';
import { asanaDeleteAttachmentAction } from './lib/actions/ai/delete-attachment';
import { asanaUploadAttachmentAction } from './lib/actions/ai/upload-attachment';
import { asanaListAccessRequestsAction } from './lib/actions/ai/list-access-requests';
import { asanaCreateAccessRequestAction } from './lib/actions/ai/create-access-request';
import { asanaApproveAccessRequestAction } from './lib/actions/ai/approve-access-request';
import { asanaRejectAccessRequestAction } from './lib/actions/ai/reject-access-request';
import { asanaListReactionsAction } from './lib/actions/ai/list-reactions';
import { asanaSearchTasksAction } from './lib/actions/ai/search-tasks';
import { asanaAddTaskDependenciesAction } from './lib/actions/ai/add-task-dependencies';
import { asanaListTaskDependenciesAction } from './lib/actions/ai/list-task-dependencies';
import { asanaRemoveTaskDependenciesAction } from './lib/actions/ai/remove-task-dependencies';
import { asanaCreateCustomFieldAction } from './lib/actions/ai/create-custom-field';
import { asanaGetCustomFieldAction } from './lib/actions/ai/get-custom-field';
import { asanaListCustomFieldsAction } from './lib/actions/ai/list-custom-fields';
import { asanaUpdateCustomFieldAction } from './lib/actions/ai/update-custom-field';
import { asanaDeleteCustomFieldAction } from './lib/actions/ai/delete-custom-field';
import { asanaCreateCustomFieldEnumOptionAction } from './lib/actions/ai/create-custom-field-enum-option';
import { asanaReorderCustomFieldEnumOptionAction } from './lib/actions/ai/reorder-custom-field-enum-option';
import { asanaUpdateCustomFieldEnumOptionAction } from './lib/actions/ai/update-custom-field-enum-option';
import { asanaListProjectTemplatesAction } from './lib/actions/ai/list-project-templates';
import { asanaInstantiateProjectTemplateAction } from './lib/actions/ai/instantiate-project-template';
import { asanaListTaskTemplatesAction } from './lib/actions/ai/list-task-templates';
import { asanaListPortfoliosAction } from './lib/actions/ai/list-portfolios';
import { asanaGetPortfolioAction } from './lib/actions/ai/get-portfolio';
import { asanaListPortfolioItemsAction } from './lib/actions/ai/list-portfolio-items';
import { asanaAddPortfolioItemAction } from './lib/actions/ai/add-portfolio-item';
import { asanaRemovePortfolioItemAction } from './lib/actions/ai/remove-portfolio-item';
import { asanaListGoalsAction } from './lib/actions/ai/list-goals';
import { asanaGetGoalAction } from './lib/actions/ai/get-goal';
import { asanaListGoalRelationshipsAction } from './lib/actions/ai/list-goal-relationships';
import { asanaAddGoalSupportingRelationshipAction } from './lib/actions/ai/add-goal-supporting-relationship';
import { asanaListTimePeriodsAction } from './lib/actions/ai/list-time-periods';
import { asanaGetTimePeriodAction } from './lib/actions/ai/get-time-period';
import { asanaCreateAllocationAction } from './lib/actions/ai/create-allocation';
import { asanaGetAllocationAction } from './lib/actions/ai/get-allocation';
import { asanaListAllocationsAction } from './lib/actions/ai/list-allocations';
import { asanaUpdateAllocationAction } from './lib/actions/ai/update-allocation';
import { asanaDeleteAllocationAction } from './lib/actions/ai/delete-allocation';
import { asanaListTimeTrackingEntriesAction } from './lib/actions/ai/list-time-tracking-entries';
import { asanaListCustomTypesAction } from './lib/actions/ai/list-custom-types';
import { asanaUpdateUserAction } from './lib/actions/ai/update-user';
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
    asanaGetUserAction,
    asanaListUsersAction,
    asanaListFavoritesAction,
    asanaGetWorkspaceAction,
    asanaListWorkspaceMembershipsAction,
    asanaGetWorkspaceMembershipAction,
    asanaAddUserToWorkspaceAction,
    asanaRemoveUserFromWorkspaceAction,
    asanaCreateTeamAction,
    asanaGetTeamAction,
    asanaUpdateTeamAction,
    asanaListUserTeamsAction,
    asanaAddUserToTeamAction,
    asanaRemoveUserFromTeamAction,
    asanaListTeamMembershipsAction,
    asanaGetTeamMembershipAction,
    asanaGetAttachmentAction,
    asanaListAttachmentsAction,
    asanaDeleteAttachmentAction,
    asanaUploadAttachmentAction,
    asanaListAccessRequestsAction,
    asanaCreateAccessRequestAction,
    asanaApproveAccessRequestAction,
    asanaRejectAccessRequestAction,
    asanaListReactionsAction,
    asanaSearchTasksAction,
    asanaAddTaskDependenciesAction,
    asanaListTaskDependenciesAction,
    asanaRemoveTaskDependenciesAction,
    asanaCreateCustomFieldAction,
    asanaGetCustomFieldAction,
    asanaListCustomFieldsAction,
    asanaUpdateCustomFieldAction,
    asanaDeleteCustomFieldAction,
    asanaCreateCustomFieldEnumOptionAction,
    asanaReorderCustomFieldEnumOptionAction,
    asanaUpdateCustomFieldEnumOptionAction,
    asanaListProjectTemplatesAction,
    asanaInstantiateProjectTemplateAction,
    asanaListTaskTemplatesAction,
    asanaListPortfoliosAction,
    asanaGetPortfolioAction,
    asanaListPortfolioItemsAction,
    asanaAddPortfolioItemAction,
    asanaRemovePortfolioItemAction,
    asanaListGoalsAction,
    asanaGetGoalAction,
    asanaListGoalRelationshipsAction,
    asanaAddGoalSupportingRelationshipAction,
    asanaListTimePeriodsAction,
    asanaGetTimePeriodAction,
    asanaCreateAllocationAction,
    asanaGetAllocationAction,
    asanaListAllocationsAction,
    asanaUpdateAllocationAction,
    asanaDeleteAllocationAction,
    asanaListTimeTrackingEntriesAction,
    asanaListCustomTypesAction,
    asanaUpdateUserAction,
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
