import { aiAskAction } from './ai/ai-ask';
import { aiExtractStructuredAction } from './ai/ai-extract-structured';
import { aiExtractAction } from './ai/ai-extract';
import { aiGenerateTextAction } from './ai/ai-generate-text';
import { getAiAgentDefaultConfigAction } from './ai/get-ai-agent-default-config';
import { listFileAppItemAssociationsAction } from './app-items/list-file-app-item-associations';
import { listFolderAppItemAssociationsAction } from './app-items/list-folder-app-item-associations';
import { createCollaborationAction } from './collaborations/create-collaboration';
import { deleteCollaborationAction } from './collaborations/delete-collaboration';
import { getCollaborationAction } from './collaborations/get-collaboration';
import { listFileCollaborationsAction } from './collaborations/list-file-collaborations';
import { listFolderCollaborationsAction } from './collaborations/list-folder-collaborations';
import { listGroupCollaborationsAction } from './collaborations/list-group-collaborations';
import { listPendingCollaborationsAction } from './collaborations/list-pending-collaborations';
import { updateCollaborationAction } from './collaborations/update-collaboration';
import { getCollectionAction } from './collections/get-collection';
import { listCollectionItemsAction } from './collections/list-collection-items';
import { listCollectionsAction } from './collections/list-collections';
import { createCommentAction } from './comments/create-comment';
import { deleteCommentAction } from './comments/delete-comment';
import { getCommentAction } from './comments/get-comment';
import { listFileCommentsAction } from './comments/list-file-comments';
import { updateCommentAction } from './comments/update-comment';
import { listDevicePinsAction } from './device-pins/list-device-pins';
import { downloadFileAction } from './downloads/download-file';
import { listEventsAction } from './events/list-events';
import { deleteFileVersionAction } from './file-versions/delete-file-version';
import { getFileVersionAction } from './file-versions/get-file-version';
import { listFileVersionsAction } from './file-versions/list-file-versions';
import { promoteFileVersionAction } from './file-versions/promote-file-version';
import { restoreFileVersionAction } from './file-versions/restore-file-version';
import { copyFileAction } from './files/copy-file';
import { deleteFileAction } from './files/delete-file';
import { getFileThumbnailAction } from './files/get-file-thumbnail';
import { getFileAction } from './files/get-file';
import { updateFileAction } from './files/update-file';
import { createFolderLockAction } from './folder-locks/create-folder-lock';
import { deleteFolderLockAction } from './folder-locks/delete-folder-lock';
import { listFolderLocksAction } from './folder-locks/list-folder-locks';
import { copyFolderAction } from './folders/copy-folder';
import { createFolderAction } from './folders/create-folder';
import { deleteFolderAction } from './folders/delete-folder';
import { getFolderAction } from './folders/get-folder';
import { listFolderItemsAction } from './folders/list-folder-items';
import { updateFolderAction } from './folders/update-folder';
import { addUserToGroupAction } from './groups/add-user-to-group';
import { createGroupAction } from './groups/create-group';
import { deleteGroupAction } from './groups/delete-group';
import { getGroupMembershipAction } from './groups/get-group-membership';
import { getGroupAction } from './groups/get-group';
import { listGroupMembershipsAction } from './groups/list-group-memberships';
import { listGroupsAction } from './groups/list-groups';
import { listUserMembershipsAction } from './groups/list-user-memberships';
import { removeUserFromGroupAction } from './groups/remove-user-from-group';
import { updateGroupMembershipAction } from './groups/update-group-membership';
import { updateGroupAction } from './groups/update-group';
import { listSlackIntegrationMappingsAction } from './integration-mappings/list-slack-integration-mappings';
import { applyMetadataCascadePolicyAction } from './metadata-cascade-policies/apply-metadata-cascade-policy';
import { createMetadataCascadePolicyAction } from './metadata-cascade-policies/create-metadata-cascade-policy';
import { deleteMetadataCascadePolicyAction } from './metadata-cascade-policies/delete-metadata-cascade-policy';
import { getMetadataCascadePolicyAction } from './metadata-cascade-policies/get-metadata-cascade-policy';
import { listMetadataCascadePoliciesAction } from './metadata-cascade-policies/list-metadata-cascade-policies';
import { appendMetadataTaxonomyLevelAction } from './metadata-taxonomies/append-metadata-taxonomy-level';
import { createMetadataTaxonomyLevelsAction } from './metadata-taxonomies/create-metadata-taxonomy-levels';
import { createMetadataTaxonomyNodeAction } from './metadata-taxonomies/create-metadata-taxonomy-node';
import { createMetadataTaxonomyAction } from './metadata-taxonomies/create-metadata-taxonomy';
import { deleteLastMetadataTaxonomyLevelAction } from './metadata-taxonomies/delete-last-metadata-taxonomy-level';
import { deleteMetadataTaxonomyNodeAction } from './metadata-taxonomies/delete-metadata-taxonomy-node';
import { deleteMetadataTaxonomyAction } from './metadata-taxonomies/delete-metadata-taxonomy';
import { getMetadataTaxonomyNodeAction } from './metadata-taxonomies/get-metadata-taxonomy-node';
import { getMetadataTaxonomyAction } from './metadata-taxonomies/get-metadata-taxonomy';
import { listMetadataTaxonomiesAction } from './metadata-taxonomies/list-metadata-taxonomies';
import { listMetadataTaxonomyNodesAction } from './metadata-taxonomies/list-metadata-taxonomy-nodes';
import { listMetadataTemplateFieldOptionsAction } from './metadata-taxonomies/list-metadata-template-field-options';
import { updateMetadataTaxonomyLevelAction } from './metadata-taxonomies/update-metadata-taxonomy-level';
import { updateMetadataTaxonomyNodeAction } from './metadata-taxonomies/update-metadata-taxonomy-node';
import { updateMetadataTaxonomyAction } from './metadata-taxonomies/update-metadata-taxonomy';
import { createMetadataTemplateAction } from './metadata-templates/create-metadata-template';
import { deleteMetadataTemplateAction } from './metadata-templates/delete-metadata-template';
import { findMetadataTemplateByInstanceAction } from './metadata-templates/find-metadata-template-by-instance';
import { getMetadataTemplateByIdAction } from './metadata-templates/get-metadata-template-by-id';
import { getMetadataTemplateAction } from './metadata-templates/get-metadata-template';
import { listEnterpriseMetadataTemplatesAction } from './metadata-templates/list-enterprise-metadata-templates';
import { listGlobalMetadataTemplatesAction } from './metadata-templates/list-global-metadata-templates';
import { updateMetadataTemplateAction } from './metadata-templates/update-metadata-template';
import { createFileMetadataAction } from './metadata/create-file-metadata';
import { createFolderMetadataAction } from './metadata/create-folder-metadata';
import { deleteFileMetadataAction } from './metadata/delete-file-metadata';
import { deleteFolderMetadataAction } from './metadata/delete-folder-metadata';
import { getFileMetadataAction } from './metadata/get-file-metadata';
import { getFolderMetadataAction } from './metadata/get-folder-metadata';
import { listFileMetadataAction } from './metadata/list-file-metadata';
import { listFolderMetadataAction } from './metadata/list-folder-metadata';
import { updateFileMetadataAction } from './metadata/update-file-metadata';
import { updateFolderMetadataAction } from './metadata/update-folder-metadata';
import { listRecentItemsAction } from './recent-items/list-recent-items';
import { queryMetadataAction } from './search/query-metadata';
import { searchAction } from './search/search';
import { findSharedItemAction } from './shared-links/find-shared-item';
import { removeFileSharedLinkAction } from './shared-links/remove-file-shared-link';
import { removeFolderSharedLinkAction } from './shared-links/remove-folder-shared-link';
import { removeWebLinkSharedLinkAction } from './shared-links/remove-web-link-shared-link';
import { setFileSharedLinkAction } from './shared-links/set-file-shared-link';
import { setFolderSharedLinkAction } from './shared-links/set-folder-shared-link';
import { setWebLinkSharedLinkAction } from './shared-links/set-web-link-shared-link';
import { cancelSignRequestAction } from './sign/cancel-sign-request';
import { createSignRequestAction } from './sign/create-sign-request';
import { getSignRequestAction } from './sign/get-sign-request';
import { listSignRequestsAction } from './sign/list-sign-requests';
import { listSignTemplatesAction } from './sign/list-sign-templates';
import { createFileSkillCardsAction } from './skills/create-file-skill-cards';
import { deleteFileSkillCardsAction } from './skills/delete-file-skill-cards';
import { listFileSkillCardsAction } from './skills/list-file-skill-cards';
import { updateFileSkillCardsAction } from './skills/update-file-skill-cards';
import { assignTaskAction } from './task-assignments/assign-task';
import { deleteTaskAssignmentAction } from './task-assignments/delete-task-assignment';
import { getTaskAssignmentAction } from './task-assignments/get-task-assignment';
import { listTaskAssignmentsAction } from './task-assignments/list-task-assignments';
import { updateTaskAssignmentAction } from './task-assignments/update-task-assignment';
import { createTaskAction } from './tasks/create-task';
import { deleteTaskAction } from './tasks/delete-task';
import { getTaskAction } from './tasks/get-task';
import { listFileTasksAction } from './tasks/list-file-tasks';
import { updateTaskAction } from './tasks/update-task';
import { deleteFilePermanentlyAction } from './trash/delete-file-permanently';
import { deleteFolderPermanentlyAction } from './trash/delete-folder-permanently';
import { getTrashedFileAction } from './trash/get-trashed-file';
import { getTrashedFolderAction } from './trash/get-trashed-folder';
import { listTrashedItemsAction } from './trash/list-trashed-items';
import { restoreFileAction } from './trash/restore-file';
import { restoreFolderAction } from './trash/restore-folder';
import { uploadFileVersionAction } from './uploads/upload-file-version';
import { uploadFileAction } from './uploads/upload-file';
import { createEmailAliasAction } from './users/create-email-alias';
import { createUserAction } from './users/create-user';
import { deleteEmailAliasAction } from './users/delete-email-alias';
import { deleteUserAvatarAction } from './users/delete-user-avatar';
import { deleteUserAction } from './users/delete-user';
import { getCurrentUserAction } from './users/get-current-user';
import { getUserAvatarAction } from './users/get-user-avatar';
import { getUserAction } from './users/get-user';
import { listEmailAliasesAction } from './users/list-email-aliases';
import { listUsersAction } from './users/list-users';
import { setUserAvatarAction } from './users/set-user-avatar';
import { terminateGroupSessionsAction } from './users/terminate-group-sessions';
import { terminateUserSessionsAction } from './users/terminate-user-sessions';
import { transferOwnedFoldersAction } from './users/transfer-owned-folders';
import { updateUserAction } from './users/update-user';
import { applyFileWatermarkAction } from './watermarks/apply-file-watermark';
import { applyFolderWatermarkAction } from './watermarks/apply-folder-watermark';
import { getFileWatermarkAction } from './watermarks/get-file-watermark';
import { getFolderWatermarkAction } from './watermarks/get-folder-watermark';
import { removeFileWatermarkAction } from './watermarks/remove-file-watermark';
import { removeFolderWatermarkAction } from './watermarks/remove-folder-watermark';
import { createWebLinkAction } from './web-links/create-web-link';
import { deleteWebLinkPermanentlyAction } from './web-links/delete-web-link-permanently';
import { deleteWebLinkAction } from './web-links/delete-web-link';
import { getTrashedWebLinkAction } from './web-links/get-trashed-web-link';
import { getWebLinkAction } from './web-links/get-web-link';
import { restoreWebLinkAction } from './web-links/restore-web-link';
import { updateWebLinkAction } from './web-links/update-web-link';
import { listWorkflowsAction } from './workflows/list-workflows';
import { createZipDownloadAction } from './zip-downloads/create-zip-download';
import { downloadZipAction } from './zip-downloads/download-zip';
import { getZipDownloadStatusAction } from './zip-downloads/get-zip-download-status';

export const boxAiActions = [
  aiAskAction,
  aiExtractStructuredAction,
  aiExtractAction,
  aiGenerateTextAction,
  getAiAgentDefaultConfigAction,
  listFileAppItemAssociationsAction,
  listFolderAppItemAssociationsAction,
  createCollaborationAction,
  deleteCollaborationAction,
  getCollaborationAction,
  listFileCollaborationsAction,
  listFolderCollaborationsAction,
  listGroupCollaborationsAction,
  listPendingCollaborationsAction,
  updateCollaborationAction,
  getCollectionAction,
  listCollectionItemsAction,
  listCollectionsAction,
  createCommentAction,
  deleteCommentAction,
  getCommentAction,
  listFileCommentsAction,
  updateCommentAction,
  listDevicePinsAction,
  downloadFileAction,
  listEventsAction,
  deleteFileVersionAction,
  getFileVersionAction,
  listFileVersionsAction,
  promoteFileVersionAction,
  restoreFileVersionAction,
  copyFileAction,
  deleteFileAction,
  getFileThumbnailAction,
  getFileAction,
  updateFileAction,
  createFolderLockAction,
  deleteFolderLockAction,
  listFolderLocksAction,
  copyFolderAction,
  createFolderAction,
  deleteFolderAction,
  getFolderAction,
  listFolderItemsAction,
  updateFolderAction,
  addUserToGroupAction,
  createGroupAction,
  deleteGroupAction,
  getGroupMembershipAction,
  getGroupAction,
  listGroupMembershipsAction,
  listGroupsAction,
  listUserMembershipsAction,
  removeUserFromGroupAction,
  updateGroupMembershipAction,
  updateGroupAction,
  listSlackIntegrationMappingsAction,
  applyMetadataCascadePolicyAction,
  createMetadataCascadePolicyAction,
  deleteMetadataCascadePolicyAction,
  getMetadataCascadePolicyAction,
  listMetadataCascadePoliciesAction,
  appendMetadataTaxonomyLevelAction,
  createMetadataTaxonomyLevelsAction,
  createMetadataTaxonomyNodeAction,
  createMetadataTaxonomyAction,
  deleteLastMetadataTaxonomyLevelAction,
  deleteMetadataTaxonomyNodeAction,
  deleteMetadataTaxonomyAction,
  getMetadataTaxonomyNodeAction,
  getMetadataTaxonomyAction,
  listMetadataTaxonomiesAction,
  listMetadataTaxonomyNodesAction,
  listMetadataTemplateFieldOptionsAction,
  updateMetadataTaxonomyLevelAction,
  updateMetadataTaxonomyNodeAction,
  updateMetadataTaxonomyAction,
  createMetadataTemplateAction,
  deleteMetadataTemplateAction,
  findMetadataTemplateByInstanceAction,
  getMetadataTemplateByIdAction,
  getMetadataTemplateAction,
  listEnterpriseMetadataTemplatesAction,
  listGlobalMetadataTemplatesAction,
  updateMetadataTemplateAction,
  createFileMetadataAction,
  createFolderMetadataAction,
  deleteFileMetadataAction,
  deleteFolderMetadataAction,
  getFileMetadataAction,
  getFolderMetadataAction,
  listFileMetadataAction,
  listFolderMetadataAction,
  updateFileMetadataAction,
  updateFolderMetadataAction,
  listRecentItemsAction,
  queryMetadataAction,
  searchAction,
  findSharedItemAction,
  removeFileSharedLinkAction,
  removeFolderSharedLinkAction,
  removeWebLinkSharedLinkAction,
  setFileSharedLinkAction,
  setFolderSharedLinkAction,
  setWebLinkSharedLinkAction,
  cancelSignRequestAction,
  createSignRequestAction,
  getSignRequestAction,
  listSignRequestsAction,
  listSignTemplatesAction,
  createFileSkillCardsAction,
  deleteFileSkillCardsAction,
  listFileSkillCardsAction,
  updateFileSkillCardsAction,
  assignTaskAction,
  deleteTaskAssignmentAction,
  getTaskAssignmentAction,
  listTaskAssignmentsAction,
  updateTaskAssignmentAction,
  createTaskAction,
  deleteTaskAction,
  getTaskAction,
  listFileTasksAction,
  updateTaskAction,
  deleteFilePermanentlyAction,
  deleteFolderPermanentlyAction,
  getTrashedFileAction,
  getTrashedFolderAction,
  listTrashedItemsAction,
  restoreFileAction,
  restoreFolderAction,
  uploadFileVersionAction,
  uploadFileAction,
  createEmailAliasAction,
  createUserAction,
  deleteEmailAliasAction,
  deleteUserAvatarAction,
  deleteUserAction,
  getCurrentUserAction,
  getUserAvatarAction,
  getUserAction,
  listEmailAliasesAction,
  listUsersAction,
  setUserAvatarAction,
  terminateGroupSessionsAction,
  terminateUserSessionsAction,
  transferOwnedFoldersAction,
  updateUserAction,
  applyFileWatermarkAction,
  applyFolderWatermarkAction,
  getFileWatermarkAction,
  getFolderWatermarkAction,
  removeFileWatermarkAction,
  removeFolderWatermarkAction,
  createWebLinkAction,
  deleteWebLinkPermanentlyAction,
  deleteWebLinkAction,
  getTrashedWebLinkAction,
  getWebLinkAction,
  restoreWebLinkAction,
  updateWebLinkAction,
  listWorkflowsAction,
  createZipDownloadAction,
  downloadZipAction,
  getZipDownloadStatusAction,
];
