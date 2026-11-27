import { createAiAgentAction } from './ai-studio/create-ai-agent';
import { deleteAiAgentAction } from './ai-studio/delete-ai-agent';
import { getAiAgentAction } from './ai-studio/get-ai-agent';
import { listAiAgentsAction } from './ai-studio/list-ai-agents';
import { updateAiAgentAction } from './ai-studio/update-ai-agent';
import { aiAskAction } from './ai/ai-ask';
import { aiExtractStructuredAction } from './ai/ai-extract-structured';
import { aiExtractAction } from './ai/ai-extract';
import { aiGenerateTextAction } from './ai/ai-generate-text';
import { getAiAgentDefaultConfigAction } from './ai/get-ai-agent-default-config';
import { listFileAppItemAssociationsAction } from './app-items/list-file-app-item-associations';
import { listFolderAppItemAssociationsAction } from './app-items/list-folder-app-item-associations';
import { addClassificationAction } from './classifications/add-classification';
import { addFileClassificationAction } from './classifications/add-file-classification';
import { addFolderClassificationAction } from './classifications/add-folder-classification';
import { createClassificationTemplateAction } from './classifications/create-classification-template';
import { getFileClassificationAction } from './classifications/get-file-classification';
import { getFolderClassificationAction } from './classifications/get-folder-classification';
import { listClassificationsAction } from './classifications/list-classifications';
import { removeFileClassificationAction } from './classifications/remove-file-classification';
import { removeFolderClassificationAction } from './classifications/remove-folder-classification';
import { updateClassificationAction } from './classifications/update-classification';
import { updateFileClassificationAction } from './classifications/update-file-classification';
import { updateFolderClassificationAction } from './classifications/update-folder-classification';
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
import { deleteDevicePinAction } from './device-pins/delete-device-pin';
import { getDevicePinAction } from './device-pins/get-device-pin';
import { listDevicePinsAction } from './device-pins/list-device-pins';
import { addAllowedCollaborationDomainAction } from './domain-restrictions/add-allowed-collaboration-domain';
import { createCollaborationDomainExemptionAction } from './domain-restrictions/create-collaboration-domain-exemption';
import { deleteCollaborationDomainExemptionAction } from './domain-restrictions/delete-collaboration-domain-exemption';
import { getAllowedCollaborationDomainAction } from './domain-restrictions/get-allowed-collaboration-domain';
import { getCollaborationDomainExemptionAction } from './domain-restrictions/get-collaboration-domain-exemption';
import { listAllowedCollaborationDomainsAction } from './domain-restrictions/list-allowed-collaboration-domains';
import { listCollaborationDomainExemptionsAction } from './domain-restrictions/list-collaboration-domain-exemptions';
import { removeAllowedCollaborationDomainAction } from './domain-restrictions/remove-allowed-collaboration-domain';
import { downloadFileAction } from './downloads/download-file';
import { listEventsAction } from './events/list-events';
import { copyFileRequestAction } from './file-requests/copy-file-request';
import { deleteFileRequestAction } from './file-requests/delete-file-request';
import { getFileRequestAction } from './file-requests/get-file-request';
import { updateFileRequestAction } from './file-requests/update-file-request';
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
import { createSlackIntegrationMappingAction } from './integration-mappings/create-slack-integration-mapping';
import { createTeamsIntegrationMappingAction } from './integration-mappings/create-teams-integration-mapping';
import { deleteSlackIntegrationMappingAction } from './integration-mappings/delete-slack-integration-mapping';
import { deleteTeamsIntegrationMappingAction } from './integration-mappings/delete-teams-integration-mapping';
import { listSlackIntegrationMappingsAction } from './integration-mappings/list-slack-integration-mappings';
import { listTeamsIntegrationMappingsAction } from './integration-mappings/list-teams-integration-mappings';
import { updateSlackIntegrationMappingAction } from './integration-mappings/update-slack-integration-mapping';
import { updateTeamsIntegrationMappingAction } from './integration-mappings/update-teams-integration-mapping';
import { assignLegalHoldPolicyAction } from './legal-hold/assign-legal-hold-policy';
import { createLegalHoldPolicyAction } from './legal-hold/create-legal-hold-policy';
import { deleteLegalHoldPolicyAction } from './legal-hold/delete-legal-hold-policy';
import { getFileVersionLegalHoldAction } from './legal-hold/get-file-version-legal-hold';
import { getLegalHoldPolicyAssignmentAction } from './legal-hold/get-legal-hold-policy-assignment';
import { getLegalHoldPolicyAction } from './legal-hold/get-legal-hold-policy';
import { listFileVersionsOnLegalHoldAction } from './legal-hold/list-file-versions-on-legal-hold';
import { listFilesOnLegalHoldAction } from './legal-hold/list-files-on-legal-hold';
import { listLegalHoldPoliciesAction } from './legal-hold/list-legal-hold-policies';
import { listLegalHoldPolicyAssignmentsAction } from './legal-hold/list-legal-hold-policy-assignments';
import { unassignLegalHoldPolicyAction } from './legal-hold/unassign-legal-hold-policy';
import { updateLegalHoldPolicyAction } from './legal-hold/update-legal-hold-policy';
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
import { assignRetentionPolicyAction } from './retention/assign-retention-policy';
import { createRetentionPolicyAction } from './retention/create-retention-policy';
import { deleteRetentionPolicyAssignmentAction } from './retention/delete-retention-policy-assignment';
import { deleteRetentionPolicyAction } from './retention/delete-retention-policy';
import { getRetentionPolicyAssignmentAction } from './retention/get-retention-policy-assignment';
import { getRetentionPolicyAction } from './retention/get-retention-policy';
import { listFileVersionsUnderRetentionAction } from './retention/list-file-versions-under-retention';
import { listFilesUnderRetentionAction } from './retention/list-files-under-retention';
import { listRetentionPoliciesAction } from './retention/list-retention-policies';
import { listRetentionPolicyAssignmentsAction } from './retention/list-retention-policy-assignments';
import { updateRetentionPolicyAction } from './retention/update-retention-policy';
import { queryMetadataAction } from './search/query-metadata';
import { searchAction } from './search/search';
import { findSharedItemAction } from './shared-links/find-shared-item';
import { removeFileSharedLinkAction } from './shared-links/remove-file-shared-link';
import { removeFolderSharedLinkAction } from './shared-links/remove-folder-shared-link';
import { removeWebLinkSharedLinkAction } from './shared-links/remove-web-link-shared-link';
import { setFileSharedLinkAction } from './shared-links/set-file-shared-link';
import { setFolderSharedLinkAction } from './shared-links/set-folder-shared-link';
import { setWebLinkSharedLinkAction } from './shared-links/set-web-link-shared-link';
import { changeShieldBarrierStatusAction } from './shield/change-shield-barrier-status';
import { createShieldBarrierReportAction } from './shield/create-shield-barrier-report';
import { createShieldBarrierSegmentMemberAction } from './shield/create-shield-barrier-segment-member';
import { createShieldBarrierSegmentRestrictionAction } from './shield/create-shield-barrier-segment-restriction';
import { createShieldBarrierSegmentAction } from './shield/create-shield-barrier-segment';
import { createShieldBarrierAction } from './shield/create-shield-barrier';
import { deleteShieldBarrierSegmentMemberAction } from './shield/delete-shield-barrier-segment-member';
import { deleteShieldBarrierSegmentRestrictionAction } from './shield/delete-shield-barrier-segment-restriction';
import { deleteShieldBarrierSegmentAction } from './shield/delete-shield-barrier-segment';
import { getShieldBarrierReportAction } from './shield/get-shield-barrier-report';
import { getShieldBarrierSegmentMemberAction } from './shield/get-shield-barrier-segment-member';
import { getShieldBarrierSegmentRestrictionAction } from './shield/get-shield-barrier-segment-restriction';
import { getShieldBarrierSegmentAction } from './shield/get-shield-barrier-segment';
import { getShieldBarrierAction } from './shield/get-shield-barrier';
import { listShieldBarrierReportsAction } from './shield/list-shield-barrier-reports';
import { listShieldBarrierSegmentMembersAction } from './shield/list-shield-barrier-segment-members';
import { listShieldBarrierSegmentRestrictionsAction } from './shield/list-shield-barrier-segment-restrictions';
import { listShieldBarrierSegmentsAction } from './shield/list-shield-barrier-segments';
import { listShieldBarriersAction } from './shield/list-shield-barriers';
import { updateShieldBarrierSegmentAction } from './shield/update-shield-barrier-segment';
import { cancelSignRequestAction } from './sign/cancel-sign-request';
import { createSignRequestAction } from './sign/create-sign-request';
import { getSignRequestAction } from './sign/get-sign-request';
import { getSignTemplateAction } from './sign/get-sign-template';
import { listSignRequestsAction } from './sign/list-sign-requests';
import { listSignTemplatesAction } from './sign/list-sign-templates';
import { resendSignRequestAction } from './sign/resend-sign-request';
import { createFileSkillCardsAction } from './skills/create-file-skill-cards';
import { deleteFileSkillCardsAction } from './skills/delete-file-skill-cards';
import { listFileSkillCardsAction } from './skills/list-file-skill-cards';
import { updateFileSkillCardsAction } from './skills/update-file-skill-cards';
import { assignStoragePolicyAction } from './storage-policies/assign-storage-policy';
import { deleteStoragePolicyAssignmentAction } from './storage-policies/delete-storage-policy-assignment';
import { getStoragePolicyAssignmentAction } from './storage-policies/get-storage-policy-assignment';
import { getStoragePolicyAction } from './storage-policies/get-storage-policy';
import { listStoragePoliciesAction } from './storage-policies/list-storage-policies';
import { listStoragePolicyAssignmentsAction } from './storage-policies/list-storage-policy-assignments';
import { updateStoragePolicyAssignmentAction } from './storage-policies/update-storage-policy-assignment';
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
import { createTermsOfServiceUserStatusAction } from './terms-of-service/create-terms-of-service-user-status';
import { createTermsOfServiceAction } from './terms-of-service/create-terms-of-service';
import { getTermsOfServiceAction } from './terms-of-service/get-terms-of-service';
import { listTermsOfServiceUserStatusesAction } from './terms-of-service/list-terms-of-service-user-statuses';
import { listTermsOfServiceAction } from './terms-of-service/list-terms-of-service';
import { updateTermsOfServiceUserStatusAction } from './terms-of-service/update-terms-of-service-user-status';
import { updateTermsOfServiceAction } from './terms-of-service/update-terms-of-service';
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
import { getInviteAction } from './users/get-invite';
import { getUserAvatarAction } from './users/get-user-avatar';
import { getUserAction } from './users/get-user';
import { inviteUserAction } from './users/invite-user';
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
import { startWorkflowAction } from './workflows/start-workflow';
import { createZipDownloadAction } from './zip-downloads/create-zip-download';
import { downloadZipAction } from './zip-downloads/download-zip';
import { getZipDownloadStatusAction } from './zip-downloads/get-zip-download-status';

export const boxAiActions = [
  createAiAgentAction,
  deleteAiAgentAction,
  getAiAgentAction,
  listAiAgentsAction,
  updateAiAgentAction,
  aiAskAction,
  aiExtractStructuredAction,
  aiExtractAction,
  aiGenerateTextAction,
  getAiAgentDefaultConfigAction,
  listFileAppItemAssociationsAction,
  listFolderAppItemAssociationsAction,
  addClassificationAction,
  addFileClassificationAction,
  addFolderClassificationAction,
  createClassificationTemplateAction,
  getFileClassificationAction,
  getFolderClassificationAction,
  listClassificationsAction,
  removeFileClassificationAction,
  removeFolderClassificationAction,
  updateClassificationAction,
  updateFileClassificationAction,
  updateFolderClassificationAction,
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
  deleteDevicePinAction,
  getDevicePinAction,
  listDevicePinsAction,
  addAllowedCollaborationDomainAction,
  createCollaborationDomainExemptionAction,
  deleteCollaborationDomainExemptionAction,
  getAllowedCollaborationDomainAction,
  getCollaborationDomainExemptionAction,
  listAllowedCollaborationDomainsAction,
  listCollaborationDomainExemptionsAction,
  removeAllowedCollaborationDomainAction,
  downloadFileAction,
  listEventsAction,
  copyFileRequestAction,
  deleteFileRequestAction,
  getFileRequestAction,
  updateFileRequestAction,
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
  createSlackIntegrationMappingAction,
  createTeamsIntegrationMappingAction,
  deleteSlackIntegrationMappingAction,
  deleteTeamsIntegrationMappingAction,
  listSlackIntegrationMappingsAction,
  listTeamsIntegrationMappingsAction,
  updateSlackIntegrationMappingAction,
  updateTeamsIntegrationMappingAction,
  assignLegalHoldPolicyAction,
  createLegalHoldPolicyAction,
  deleteLegalHoldPolicyAction,
  getFileVersionLegalHoldAction,
  getLegalHoldPolicyAssignmentAction,
  getLegalHoldPolicyAction,
  listFileVersionsOnLegalHoldAction,
  listFilesOnLegalHoldAction,
  listLegalHoldPoliciesAction,
  listLegalHoldPolicyAssignmentsAction,
  unassignLegalHoldPolicyAction,
  updateLegalHoldPolicyAction,
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
  assignRetentionPolicyAction,
  createRetentionPolicyAction,
  deleteRetentionPolicyAssignmentAction,
  deleteRetentionPolicyAction,
  getRetentionPolicyAssignmentAction,
  getRetentionPolicyAction,
  listFileVersionsUnderRetentionAction,
  listFilesUnderRetentionAction,
  listRetentionPoliciesAction,
  listRetentionPolicyAssignmentsAction,
  updateRetentionPolicyAction,
  queryMetadataAction,
  searchAction,
  findSharedItemAction,
  removeFileSharedLinkAction,
  removeFolderSharedLinkAction,
  removeWebLinkSharedLinkAction,
  setFileSharedLinkAction,
  setFolderSharedLinkAction,
  setWebLinkSharedLinkAction,
  changeShieldBarrierStatusAction,
  createShieldBarrierReportAction,
  createShieldBarrierSegmentMemberAction,
  createShieldBarrierSegmentRestrictionAction,
  createShieldBarrierSegmentAction,
  createShieldBarrierAction,
  deleteShieldBarrierSegmentMemberAction,
  deleteShieldBarrierSegmentRestrictionAction,
  deleteShieldBarrierSegmentAction,
  getShieldBarrierReportAction,
  getShieldBarrierSegmentMemberAction,
  getShieldBarrierSegmentRestrictionAction,
  getShieldBarrierSegmentAction,
  getShieldBarrierAction,
  listShieldBarrierReportsAction,
  listShieldBarrierSegmentMembersAction,
  listShieldBarrierSegmentRestrictionsAction,
  listShieldBarrierSegmentsAction,
  listShieldBarriersAction,
  updateShieldBarrierSegmentAction,
  cancelSignRequestAction,
  createSignRequestAction,
  getSignRequestAction,
  getSignTemplateAction,
  listSignRequestsAction,
  listSignTemplatesAction,
  resendSignRequestAction,
  createFileSkillCardsAction,
  deleteFileSkillCardsAction,
  listFileSkillCardsAction,
  updateFileSkillCardsAction,
  assignStoragePolicyAction,
  deleteStoragePolicyAssignmentAction,
  getStoragePolicyAssignmentAction,
  getStoragePolicyAction,
  listStoragePoliciesAction,
  listStoragePolicyAssignmentsAction,
  updateStoragePolicyAssignmentAction,
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
  createTermsOfServiceUserStatusAction,
  createTermsOfServiceAction,
  getTermsOfServiceAction,
  listTermsOfServiceUserStatusesAction,
  listTermsOfServiceAction,
  updateTermsOfServiceUserStatusAction,
  updateTermsOfServiceAction,
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
  getInviteAction,
  getUserAvatarAction,
  getUserAction,
  inviteUserAction,
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
  startWorkflowAction,
  createZipDownloadAction,
  downloadZipAction,
  getZipDownloadStatusAction,
];
