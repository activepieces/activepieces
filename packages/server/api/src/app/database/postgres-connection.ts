import { TlsOptions } from 'node:tls'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil, spreadIfDefined } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { MakeStripeSubscriptionNullable1685053959806 } from '../ee/database/migrations/postgres/1685053959806-MakeStripeSubscriptionNullable'
import { AddTemplates1685538145476 } from '../ee/database/migrations/postgres/1685538145476-addTemplates'
import { ChangeToJsonToKeepKeysOrder1685991260335 } from '../ee/database/migrations/postgres/1685991260335-ChangeToJsonToPeserveKeys'
import { AddPinnedAndBlogUrlToTemplates1686133672743 } from '../ee/database/migrations/postgres/1686133672743-AddPinnedAndBlogUrlToTemplates'
import { AddPinnedOrder1686154285890 } from '../ee/database/migrations/postgres/1686154285890-add_pinned_order'
import { AddProjectIdToTemplate1688083336934 } from '../ee/database/migrations/postgres/1688083336934-AddProjectIdToTemplate'
import { AddBillingParameters1688739844617 } from '../ee/database/migrations/postgres/1688739844617-AddBillingParameters'
import { AddAppSumo1688943462327 } from '../ee/database/migrations/postgres/1688943462327-AddAppSumo'
import { AddProjectMembers1689177797092 } from '../ee/database/migrations/postgres/1689177797092-AddProjectMembers'
import { AddTasksPerDays1689336533370 } from '../ee/database/migrations/postgres/1689336533370-AddTasksPerDays'
import { RemoveCalculatedMetrics1689806173642 } from '../ee/database/migrations/postgres/1689806173642-RemoveCalculatedMetrics'
import { AddReferral1690459469381 } from '../ee/database/migrations/postgres/1690459469381-AddReferral'
import { FlowTemplateAddUserIdAndImageUrl1694379223109 } from '../ee/database/migrations/postgres/1694379223109-flow-template-add-user-id-and-image-url'
import { ProjectMemberRelations1694381968985 } from '../ee/database/migrations/postgres/1694381968985-project-member-relations'
import { AddFeaturedDescriptionAndFlagToTemplates1694604120205 } from '../ee/database/migrations/postgres/1694604120205-AddFeaturedDescriptionAndFlagToTemplates'
import { ModifyBilling1694902537045 } from '../ee/database/migrations/postgres/1694902537045-ModifyBilling'
import { AddDatasourcesLimit1695916063833 } from '../ee/database/migrations/postgres/1695916063833-AddDatasourcesLimit'
import { AddPlatform1697717995884 } from '../ee/database/migrations/postgres/1697717995884-add-platform'
import { AddCustomDomain1698077078271 } from '../ee/database/migrations/postgres/1698077078271-AddCustomDomain'
import { AddMetadataFieldToFlowTemplates1744780800000 } from '../ee/database/migrations/postgres/1744780800000-AddMetadataFieldToFlowTemplates'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { AddPieceTypeAndPackageTypeToFlowVersion1696245170061 } from './migration/common/1696245170061-add-piece-type-and-package-type-to-flow-version'
import { AddPieceTypeAndPackageTypeToFlowTemplate1696245170062 } from './migration/common/1696245170062-add-piece-type-and-package-type-to-flow-template'
import { StoreCodeInsideFlow1697969398200 } from './migration/common/1697969398200-store-code-inside-flow'
import { UpdateUserStatusRenameShadowToInvited1699818680567 } from './migration/common/1699818680567-update-user-status-rename-shadow-to-invited'
import { AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822 } from './migration/common/1701096458822-add-partial-unique-index-for-email-and-platform-id-is-null'
import { AddTriggerTestStrategy1707087022764 } from './migration/common/1707087022764-add-trigger-test-strategy'
import { MigrateWebhook1709581196563 } from './migration/common/1709581196563-migrate-webhook'
import { RemoveShowActivityLog1716105958530 } from './migration/common/1716105958530-RemoveShowActivityLog'
import { AddDurationForRuns1716725027424 } from './migration/common/1716725027424-AddDurationForRuns'
import { ChangeEventRoutingConstraint1723549873495 } from './migration/common/1723549873495-ChangeEventRoutingConstraint'
import { RemoveUniqueConstraintOnStepFile1725570317713 } from './migration/common/1725570317713-RemoveUniqueConstraintOnStepFile'
import { AddUserSessionId1727130193726 } from './migration/common/1727130193726-AddUserSessionId'
import { AddLicenseKeyIntoPlatform1728827704109 } from './migration/common/1728827704109-AddLicenseKeyIntoPlatform'
import { ChangeProjectUniqueConstraintToPartialIndex1729098769827 } from './migration/common/1729098769827-ChangeProjectUniqueConstraintToPartialIndex'
import { SwitchToRouter1731019013340 } from './migration/common/1731019013340-switch-to-router'
import { ChangeExternalIdsForTables1747346473001 } from './migration/common/1747346473001-ChangeExternalIdsForTables'
import { UpgradePieceVersionsToLatest1748253670449 } from './migration/common/1748253670449-UpgradePieceVersionsToLatest'
import { DeprecateApproval1748648340742 } from './migration/common/1748648340742-DeprecateApproval'
import { RemoveProjectIdFromIndex1750712746125 } from './migration/common/1750712746125-RemoveProjectIdFromIndex'
import { SplitUpPieceMetadataIntoTools1752004202722 } from './migration/common/1752004202722-SplitUpPieceMetadataIntoTools'
import { AddIndexToIssues1756775080449 } from './migration/common/1756775080449-AddIndexToIssues'
import { AddFlowIndexToTriggerSource1757555419075 } from './migration/common/1757555283659-AddFlowIndexToTriggerSource'
import { AddAuthToPiecesMetadata1688922241747 } from './migration/postgres//1688922241747-AddAuthToPiecesMetadata'
import { FlowAndFileProjectId1674788714498 } from './migration/postgres/1674788714498-FlowAndFileProjectId'
import { initializeSchema1676238396411 } from './migration/postgres/1676238396411-initialize-schema'
import { encryptCredentials1676505294811 } from './migration/postgres/1676505294811-encrypt-credentials'
import { removeStoreAction1676649852890 } from './migration/postgres/1676649852890-remove-store-action'
import { billing1677286751592 } from './migration/postgres/1677286751592-billing'
import { addVersionToPieceSteps1677521257188 } from './migration/postgres/1677521257188-add-version-to-piece-steps'
import { productEmbed1677894800372 } from './migration/postgres/1677894800372-product-embed'
import { addEventRouting1678382946390 } from './migration/postgres/1678382946390-add-event-routing'
import { removeCollectionVersion1678492809093 } from './migration/postgres/1678492809093-removeCollectionVersion'
import { addtriggerevents1678621361185 } from './migration/postgres/1678621361185-addtriggerevents'
import { bumpFixPieceVersions1678928503715 } from './migration/postgres/1678928503715-bump-fix-piece-versions'
import { migrateSchedule1679014156667 } from './migration/postgres/1679014156667-migrate-schedule'
import { addNotificationsStatus1680563747425 } from './migration/postgres/1680563747425-add-notifications-status'
import { CreateWebhookSimulationSchema1680698259291 } from './migration/postgres/1680698259291-create-webhook-simulation-schema'
import { RemoveCollections1680986182074 } from './migration/postgres/1680986182074-RemoveCollections'
import { StoreAllPeriods1681019096716 } from './migration/postgres/1681019096716-StoreAllPeriods'
import { AddInputUiInfo1681107443963 } from './migration/postgres/1681107443963-AddInputUiInfo'
import { AllowNullableStoreEntryAndTrigger1683040965874 } from './migration/postgres/1683040965874-allow-nullable-store-entry'
import { RenameNotifications1683195711242 } from './migration/postgres/1683195711242-rename-notifications'
import { ListFlowRunsIndices1683199709317 } from './migration/postgres/1683199709317-list-flow-runs-indices'
import { ProjectNotifyStatusNotNull1683458275525 } from './migration/postgres/1683458275525-project-notify-status-not-null'
import { FlowRunPauseMetadata1683552928243 } from './migration/postgres/1683552928243-flow-run-pause-metadata'
import { ChangeVariableSyntax1683898241599 } from './migration/postgres/1683898241599-ChangeVariableSyntax'
import { PieceMetadata1685537054805 } from './migration/postgres/1685537054805-piece-metadata'
import { AddProjectIdToPieceMetadata1686090319016 } from './migration/postgres/1686090319016-AddProjectIdToPieceMetadata'
import { UnifyPieceName1686138629812 } from './migration/postgres/1686138629812-unifyPieceName'
import { AddScheduleOptions1687384796637 } from './migration/postgres/1687384796637-AddScheduleOptions'
import { AddUpdatedByInFlowVersion1689292797727 } from './migration/postgres/1689292797727-AddUpdatedByInFlowVersion'
import { AddTasksToRun1689351564290 } from './migration/postgres/1689351564290-AddTasksToRun'
import { AddAppConnectionTypeToTopLevel1691703023866 } from './migration/postgres/1691703023866-add-app-connection-type-to-top-level'
import { AddTagsToRun1692106375081 } from './migration/postgres/1692106375081-AddTagsToRun'
import { AddFileToPostgres1693004806926 } from './migration/postgres/1693004806926-AddFileToPostgres'
import { AddStatusToConnections1693402930301 } from './migration/postgres/1693402930301-AddStatusToConnections'
import { AddUserMetaInformation1693850082449 } from './migration/postgres/1693850082449-AddUserMetaInformation'
import { FixPieceMetadataOrderBug1694367186954 } from './migration/postgres/1694367186954-fix-piece-metadata-order-bug'
import { FileTypeCompression1694691554696 } from './migration/postgres/1694691554696-file-type-compression'
import { Chatbot1694902537040 } from './migration/postgres/1694902537040-Chatbot'
import { AddVisibilityStatusToChatbot1695719749099 } from './migration/postgres/1695719749099-AddVisibilityStatusToChatbot'
import { AddPieceTypeAndPackageTypeToPieceMetadata1695992551156 } from './migration/postgres/1695992551156-add-piece-type-and-package-type-to-piece-metadata'
import { AddArchiveIdToPieceMetadata1696950789636 } from './migration/postgres/1696950789636-add-archive-id-to-piece-metadata'
import { AddPlatformToProject1698065083750 } from './migration/postgres/1698065083750-add-platform-to-project'
import { AddTerminationReason1698323987669 } from './migration/postgres/1698323987669-AddTerminationReason'
import { AddSigningKey1698602417745 } from './migration/postgres/1698602417745-add-signing-key'
import { AddDisplayNameToSigningKey1698698190965 } from './migration/postgres/1698698190965-AddDisplayNameToSigningKey'
import { ManagedAuthnInitial1698700720482 } from './migration/postgres/1698700720482-managed-authn-initial'
import { AddOAuth2AppEntiity1699221414907 } from './migration/postgres/1699221414907-AddOAuth2AppEntiity'
import { AddFilteredPiecesToPlatform1699281870038 } from './migration/postgres/1699281870038-add-filtered-pieces-to-platform'
import { AddSmtpAndPrivacyUrlToPlatform1699491705906 } from './migration/postgres/1699491705906-AddSmtpAndPrivacyUrlToPlatform'
import { AddPlatformIdToUser1699901161457 } from './migration/postgres/1699901161457-add-platform-id-to-user'
import { RemoveUnusedFieldsinBilling1700132368636 } from './migration/postgres/1700132368636-RemoveUnusedFieldsinBilling'
import { AddOtpEntity1700396157624 } from './migration/postgres/1700396157624-add-otp-entity'
import { AddPlatformDefaultLanguage1700406308445 } from './migration/postgres/1700406308445-AddPlatformDefaultLanguage'
import { AddPlatformIdToPieceMetadata1700522340280 } from './migration/postgres/1700522340280-AddPlatformIdToPieceMetadata'
import { MakeStripeCustomerIdNullable1700751925992 } from './migration/postgres/1700751925992-MakeStripeCustomerIdNullable'
import { AddStateToOtp1701084418793 } from './migration/postgres/1701084418793-add-state-to-otp'
import { MigrateEeUsersToOldestPlatform1701261357197 } from './migration/postgres/1701261357197-migrate-ee-users-to-oldest-platform'
import { ModifyProjectMembersAndRemoveUserId1701647565290 } from './migration/postgres/1701647565290-ModifyProjectMembersAndRemoveUserId'
import { AddApiKeys1701716639135 } from './migration/postgres/1701716639135-AddApiKeys'
import { AddEmbeddingFeatureToPlatform1701794452891 } from './migration/postgres/1701794452891-AddEmbeddingFeatureToPlatform'
import { AddPlatformIdToFile1701807681821 } from './migration/postgres/1701807681821-AddPlatformIdToFile'
import { RemoveFlowInstance1702379794665 } from './migration/postgres/1702379794665-remove-flow-instance'
import { AddPlatformIdToFlowTemplates1703411318826 } from './migration/postgres/1703411318826-AddPlatformIdToFlowTemplates'
import { RenameAppNameToPieceName1703711596105 } from './migration/postgres/1703711596105-RenameAppNameToPieceName'
import { AddVerifiedAndChangeStatus1703769034497 } from './migration/postgres/1703769034497-AddVerifiedAndChangeStatus'
import { AddGitRepoMigrationPostgres1704503804056 } from './migration/postgres/1704503804056-AddGitRepoMigrationPostgres'
import { AddGitSyncEnabledToPlatform1704636362533 } from './migration/postgres/1704636362533-AddGitSyncEnabledToPlatform'
import { AddAuthOptionsToPlatform1704667304953 } from './migration/postgres/1704667304953-AddAuthOptionsToPlatform'
import { AddEnableEmailAuthToPlatform1704797979825 } from './migration/postgres/1704797979825-AddEnableEmailAuthToPlatform'
import { RemoveUniqueonAppNameAppCredentials1705586178452 } from './migration/postgres/1705586178452-RemoveUniqueonAppNameAppCredentials'
import { MakePlatformNotNullable1705969874745 } from './migration/postgres/1705969874745-MakePlatformNotNullable'
import { AddCategoriesToPieceMetadataPostgres1707231704973 } from './migration/postgres/1707231704973-AddCategoriesToPieceMetadataPostgres'
import { AddAuditEvents1707614902283 } from './migration/postgres/1707614902283-AddAuditEvents'
import { CreateActivityTable1708515756040 } from './migration/postgres/1708515756040-create-activity-table'
import { AddUniqueStoreConstraint1708521505204 } from './migration/postgres/1708521505204-AddUniqueStoreConstraint'
import { AddLengthLimitsToActivity1708529586342 } from './migration/postgres/1708529586342-add-length-limits-to-activity'
import { AddProjectBilling1708811745694 } from './migration/postgres/1708811745694-AddProjectBilling'
import { AddShowActivityLogToPlatform1708861032399 } from './migration/postgres/1708861032399-add-show-activity-log-to-platform'
import { AddPlatformToPostgres1709052740378 } from './migration/postgres/1709052740378-AddPlatformToPostgres'
import { AddSlugToGitRepo1709151540095 } from './migration/postgres/1709151540095-add-slug-to-git-repo'
import { AddUserEmailToReferral1709500213947 } from './migration/postgres/1709500213947-add-user-email-to-referral'
import { DropUnusedPlatformIndex1709500873378 } from './migration/postgres/1709500873378-DropUnusedPlatformIndex'
import { SetNotNullOnPlatform1709505632771 } from './migration/postgres/1709505632771-SetNotNullOnPlatform'
import { AddPlatformForeignKeyToProjectPostgres1709566642531 } from './migration/postgres/1709566642531-add-platform-foreign-key-to-project-postgres'
import { MigrateWebhookTemplate1709581196564 } from './migration/postgres/1709581196564-migrate-webhook-templates'
import { SetFlowVersionUpdatedByToNullIfUserIsDeletedPostgres1709641016072 } from './migration/postgres/1709641016072-set-flow-version-updated-by-to-null-if-user-is-deleted-postgres'
import { MoveGeneratedByFromSigningKeyToAuditEventPostgres1709669091258 } from './migration/postgres/1709669091258-move-generated-by-from-signing-key-to-audit-event-postgres'
import { AddMappingStateToGit1709753080714 } from './migration/postgres/1709753080714-AddMappingStateToGit'
import { AddAuthorsToPieces1710098373707 } from './migration/postgres/1710098373707-AddAuthorsToPieces'
import { AddDeletedToProjectPostgres1710243591721 } from './migration/postgres/1710243591721-add-deleted-to-project-postgres'
import { CascadeProjectDeleteAppCredentialsAndConnectionKey1710720610669 } from './migration/postgres/1710720610669-cascade-project-delete-app-credentials-and-connection-key'
import { CascadeProjectDeleteToActivity1710720610670 } from './migration/postgres/1710720610670-cascade-project-delete-activity'
import { AddBranchTypeToGit1711073772867 } from './migration/postgres/1711073772867-AddBranchTypeToGit'
import { MigrateInputUiInfo1711411372480 } from './migration/postgres/1711411372480-migrateInputUiInfo'
import { AddProjectUsageColumnToPiece1711768296861 } from './migration/postgres/1711768296861-AddProjectUsageColumnToPiece'
import { AddPieceTags1712107871405 } from './migration/postgres/1712107871405-AddPieceTags'
import { PiecesProjectLimits1712279318440 } from './migration/postgres/1712279318440-PiecesProjectLimits'
import { RemoveUniqueEmailOnUser1713221809186 } from './migration/postgres/1713221809186-RemoveUniqueEmailOnUser'
import { AddPlatformRoleToUser1713302610746 } from './migration/postgres/1713302610746-AddPlatformRoleToUser'
import { AddUniqueNameToFolder1713643694049 } from './migration/postgres/1713643694049-AddUniqueNameToFolder'
import { AddFeaturesToPlatform1714145914415 } from './migration/postgres/1714145914415-AddFeaturesToPlatform'
import { UnifyEnterpriseWithCloud1714249840058 } from './migration/postgres/1714249840058-UnifyEnterpriseWithCloud'
import { AddIssueEntityPostgres1714904516114 } from './migration/postgres/1714904516114-AddIssueEntityPostgres'
import { AddAlertsEntityPostgres1716989780835 } from './migration/postgres/1716989780835-AddAlertsEntityPostgres'
import { AddPremiumPiecesColumnPostgres1717370717678 } from './migration/postgres/1717370717678-AddPremiumPiecesColumnPostgres'
import { AddUserInvitation1717960689650 } from './migration/postgres/1717960689650-AddUserInvitation'
import { ModifyProjectMembers1717961669938 } from './migration/postgres/1717961669938-ModifyProjectMembers'
import { AddWorkerMachine1720101280025 } from './migration/postgres/1720101280025-AddWorkerMachine'
import { MigrateAuditEventSchema1723489038729 } from './migration/postgres/1723489038729-MigrateAuditEventSchema'
import { AddAnalyticsToPlatform1725113652923 } from './migration/postgres/1725113652923-AddAnalyticsToPlatform'
import { LogFileRelationWithFlowRun1725639666232 } from './migration/postgres/1725639666232-LogFileRelationWithFlowRun'
import { AddLogsFileIdIndex1725699690971 } from './migration/postgres/1725699690971-AddLogsFileIdIndex'
import { SupportS3Files1726364421096 } from './migration/postgres/1726364421096-SupportS3Files'
import { AddAiProviderTable1726445983043 } from './migration/postgres/1726445983043-AddAiProviderTable'
import { AddAiTokensForProjectPlan1726446092010 } from './migration/postgres/1726446092010-AddAiTokensForProjectPlan'
import { RemovePremiumPieces1727865841722 } from './migration/postgres/1727865841722-RemovePremiumPieces'
import { MigrateSMTPInPlatform1729602169179 } from './migration/postgres/1729602169179-MigrateSMTPInPlatform'
import { AddPinnedPieces1729776414647 } from './migration/postgres/1729776414647-AddPinnedPieces'
import { AddConnectionOwner1730123432651 } from './migration/postgres/1730123432651-AddConnectionOwner'
import { AppConnectionsSetNull1730627612799 } from './migration/postgres/1730627612799-AppConnectionsSetNull'
import { AddFlowSchemaVersion1730760434336 } from './migration/postgres/1730760434336-AddFlowSchemaVersion'
import { StoreTriggerEventsInFile1731247581852 } from './migration/postgres/1731247581852-StoreTriggerEventsInFile'
import { CreateProjectRoleTable1731424289830 } from './migration/postgres/1731424289830-CreateProjectRoleTable'
import { MigrateConnectionNames1731428722977 } from './migration/postgres/1731428722977-MigrateConnectionNames'
import { AddGlobalConnectionsAndRbacForPlatform1731532843905 } from './migration/postgres/1731532843905-AddGlobalConnectionsAndRbacForPlatform'
import { AddAuditLogIndicies1731711188507 } from './migration/postgres/1731711188507-AddAuditLogIndicies'
import { AddIndiciesToRunAndTriggerData1732324567513 } from './migration/postgres/1732324567513-AddIndiciesToRunAndTriggerData'
import { AddProjectRelationInUserInvitation1732790412900 } from './migration/postgres/1732790673766-AddProjectRelationInUserInvitation'
import { TablesProduct1734355488179 } from './migration/postgres/1734355488179-TablesProduct'
import { CreateProjectReleaseTable1734418823028 } from './migration/postgres/1734418823028-CreateProjectReleaseTable'
import { RemoveWorkerType1734439097357 } from './migration/postgres/1734439097357-RemoveWorkerType'
import { AddCopilotSettings1734479886363 } from './migration/postgres/1734479886363-AddCopilotSettings'
import { FieldAndRecordAndCellProjectId1734969829406 } from './migration/postgres/1734969829406-FieldAndRecordAndCell_ProjectId'
import { AddPlatformBilling1734971881345 } from './migration/postgres/1734971881345-AddPlatformBilling'
import { AddCellUniqueIndex1735057498882 } from './migration/postgres/1735057498882-AddCellUniqueIndex'
import { AddExternalIdForFlow1735262417593 } from './migration/postgres/1735262417593-AddExternalIdForFlow'
import { AddEnvironmentsEnabled1735267452262 } from './migration/postgres/1735267452262-AddEnvironmentsEnabled'
import { AddUserIdentity1735590074879 } from './migration/postgres/1735590074879-AddUserIdentity'
import { RemoveUnusedProjectBillingFields1736607721367 } from './migration/postgres/1736607721367-RemoveUnusedProjectBillingFields'
import { RenameGitRepoPermission1736813103505 } from './migration/postgres/1736813103505-RenameGitRepoPermission'
import { RestrictPieces1739546878775 } from './migration/postgres/1739546878775-RestrictPieces'
import { ProjectIdNullableInTemplate1741357285896 } from './migration/postgres/1741357285896-ProjectIdNullableInTemplate'
import { CreateTableWebhooks1741669458075 } from './migration/postgres/1741669458075-CreateTableWebhooks'
import { UpdateNotifyStatusOnEmbedding1741963410825 } from './migration/postgres/1741963410825-UpdateNotifyStatusOnEmbedding'
import { AddManualTaskTable1742304857701 } from './migration/postgres/1742304857701-AddManualTaskTable'
import { AddManualTaskCommentTable1742305104390 } from './migration/postgres/1742305104390-AddManualTaskCommentTable'
import { AddDataColumnToFieldEntity1742395892304 } from './migration/postgres/1742395892304-AddDataColumnToFieldEntity'
import { ChangeManualTasksToTodo1742432827826 } from './migration/postgres/1742432827826-ChangeManualTasksToTodo'
import { ChangeManualTasksCommentsToTodoComments1742433144687 } from './migration/postgres/1742433144687-ChangeManualTasksCommentsToTodoComments'
import { RenameApprovalUrlToResolveUrl1742991137557 } from './migration/postgres/1742991137557-RenameApprovalUrlToResolveUrl'
import { AddMCP1743128816786 } from './migration/postgres/1743128816786-AddMCP'
import { AddMetadataFields1743780156664 } from './migration/postgres/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissed1744053592923 } from './migration/postgres/1744053592923-AddLastChangelogDismissed'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994 } from './migration/postgres/1744187975994-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPiece1744822233873 } from './migration/postgres/1744822233873-AddMcpPiece'
import { RenameTodoPostiveVariantName1745272231418 } from './migration/postgres/1745272231418-RenameTodoPostiveVariantName'
import { AddConnectionIdsToFlowVersion1745530653784 } from './migration/postgres/1745530653784-AddConnectionIdsToFlowVersion'
import { AddExternalIdForTablesAndFields1746356907629 } from './migration/postgres/1746356907629-AddExternalIdForTablesAndFields'
import { MakeExternalIdNotNullable1746531094548 } from './migration/postgres/1746531094548-MakeExternalIdNotNullable'
import { ChangeMcpPieceForeignKey1746543299109 } from './migration/postgres/1746543299109-ChangeMcpPieceForeignKey'
import { AddI18nColumnToPieceMetadata1746714836833 } from './migration/postgres/1746714836833-AddI18nColumnToPieceMetadata'
import { AddHandshakeConfigurationToFlow1746848208563 } from './migration/postgres/1746848208563-AddHandshakeConfigurationToFlow'
import { AddOrderToFolder1747095861746 } from './migration/postgres/1747095861746-AddOrderToFolder'
import { RenameProjectBillingToPlatformPLan1747819919988 } from './migration/postgres/1747819919988-RenameProjectBillingToPlatformPLan'
import { AddLimitsOnPlatformPlan1747921788059 } from './migration/postgres/1747921788059-AddLimitsOnPlatformPlan'
import { AddMcpToolEntity1748352614033 } from './migration/postgres/1748352614033-AddMcpToolEntity'
import { AddMcpRunEntity1748358415599 } from './migration/postgres/1748358415599-AddMcpRunEntity'
import { AddAgentsModule1748456786940 } from './migration/postgres/1748456786940-AddAgentsModule'
import { AddTodoActivity1748525529096 } from './migration/postgres/1748525529096-AddTodoActivity'
import { AddPlanNameOnPlatformPlan1748549003744 } from './migration/postgres/1748549003744-AddPlanNameOnPlatformPlan'
import { AddCreatedByUserIdInTodo1748565250553 } from './migration/postgres/1748565250553-AddCreatedByUserIdInTodo'
import { AddTodoEnvironment1748573003639 } from './migration/postgres/1748573003639-AddTodoEnvironment'
import { AIProviderRedactorPostgres1748871900624 } from './migration/postgres/1748871900624-AIProviderRedactorPostgres.ts'
import { MigrateMcpFlowsToBeTools1748996336492 } from './migration/postgres/1748996336492-MigrateMcpFlowsToBeTools'
import { AddMcpToolFlowCascadeDelete1749128866314 } from './migration/postgres/1749128866314-AddMcpToolFlowCascadeDelete'
import { AddAgents1749405724276 } from './migration/postgres/1749405724276-AddAgents'
import { RemoveDefaultLocaleFromPlatform1749733527371 } from './migration/postgres/1749733527371-removeDefaultLocaleFromPlatform'
import { AddAgentOutput1749859119064 } from './migration/postgres/1749859119064-AddAgentOutput'
import { AddAgentsLimitToPlatformPlan1749917984363 } from './migration/postgres/1749917984363-AddAgentsLimitToPlatformPlan'
import { AddStepToIssuesTable1750017637712 } from './migration/postgres/1750017637712-AddStepToIssuesTable'
import { MakeStepNameOptional1750025401754 } from './migration/postgres/1750025401754-MakeStepNameOptional'
import { AIUsagePostgres1750090291551 } from './migration/postgres/1750090291551-AIUsagePostgres'
import { RemoveUniqueOnFlow1750093037011 } from './migration/postgres/1750093037011-RemoveUniqueOnFlow'
import { ChangeTodoActivityContentFormat1750354589729 } from './migration/postgres/1750354589729-ChangeTodoActivityContentFormat'
import { RevertDescriptionTodoNaming1750389164014 } from './migration/postgres/1750389164014-RevertDescriptionTodoNaming'
import { RegenerateIssuesTable1750392148590 } from './migration/postgres/1750392148590-RegenerateIssuesTable'
import { AddPlatformIdToAiUsage1750526457504 } from './migration/postgres/1750526457504-AddPlatformIdToAiUsage'
import { AddBillingCycleDates1750704192423 } from './migration/postgres/1750704192423-addBillingCycleDates'
import { ReplaceTasksLimitWithIncludedTasks1750720173459 } from './migration/postgres/1750720173459-replaceTasksLimitWithIncludedTasks'
import { RenameIncludedTasksToTasksLimit1750722071472 } from './migration/postgres/1750722071472-renameIncludedTasksToTasksLimit'
import { AddPaymentMethodToPlatformPlan1751021111433 } from './migration/postgres/1751021111433-addPaymentMethodToPlatformPlan'
import { RevertTodoActivties1751217652277 } from './migration/postgres/1751217652277-RevertTodoActivties'
import { AddAgentsEnabledToPlatformPlan1751309258332 } from './migration/postgres/1751309258332-AddAgentsEnabledToPlatformPlan'
import { AddTrialFlagInPlatform1751394161203 } from './migration/postgres/1751394161203-AddTrialFlagInPlatform'
import { UpdateAiCredits1751404517528 } from './migration/postgres/1751404517528-update-ai-credits'
import { AddAiOverageState1751466404493 } from './migration/postgres/1751466404493-add-ai-overage-state'
import { RemoveTerminationReason1751728035816 } from './migration/postgres/1751728035816-RemoveTerminationReason'
import { AddLockedColumnToProjectPlan1751878623268 } from './migration/postgres/1751878623268-AddLockedColumnToProjectPlan'
import { AddFlowVersionToIssue1751927222122 } from './migration/postgres/1751927222122-AddFlowVersionToIssue'
import { AddMcpsEnabled1751989232042 } from './migration/postgres/1751989232042-AddMcpsEnabled'
import { AddIndexForSchemaVersionInFlowVersion1752151941009 } from './migration/postgres/1752151941009-AddIndexForSchemaVersionInFlowVersion'
import { AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028 } from './migration/postgres/1752511716028-AddCreatedToFlowVersionFlowIdIdxPostgres'
import { AddAgentRunsEntityPostgres1752583341290 } from './migration/postgres/1752583341290-AddAgentRunsEntityPostgres'
import { AddPlatformAnalyticsReportEntity1753091760355 } from './migration/postgres/1753091760355-AddPlatformAnalyticsReportEntity'
import { AddAgentIdToTable1753315220453 } from './migration/postgres/1753315220453-AddAgentIdToTable'
import { MakeTriggerNullable1753366163403 } from './migration/postgres/1753366163403-MakeTriggerNullable'
import { AddIndexForAgentTable1753400133786 } from './migration/postgres/1753400133786-AddIndexForAgentTable'
import { AddAIUsageMetadatapostgres1753624069238 } from './migration/postgres/1753624069238-AddAIUsageMetadatapostgres'
import { AddExternalIdToAgentId1753641361099 } from './migration/postgres/1753641361099-AddExternalIdToAgentId'
import { AddParentRunIdToFlowRun1753699877817 } from './migration/postgres/1753699877817-AddParentRunIdToFlowRun'
import { AddCascadeOnAgents1753727379513 } from './migration/postgres/1753727379513-AddCascadeOnAgents'
import { AddExternalIdToMCPPostgres1753787093467 } from './migration/postgres/1753787093467-AddExternalIdToMCPPostgres'
import { AddExternalidToMCPToolPostgres1754214833292 } from './migration/postgres/1754214833292-AddExternalidToMCPToolPostgres'
import { AddStepNameToTestInFlowRunEntity1754330492027 } from './migration/postgres/1754330492027-AddStepNameToTestInFlowRunEntity'
import { AddTriggerSource1754478770608 } from './migration/postgres/1754478770608-AddTriggerSource'
import { AddJobIdToTriggerRun1754510611628 } from './migration/postgres/1754510611628-AddJobIdToTriggerRun'
import { AddBillingCycle1754559781173 } from './migration/postgres/1754559781173-addBillingCycle'
import { EligibileForTrial1754852385518 } from './migration/postgres/1754852385518-EligibileForTrial'
import { RemoveAgentTestPrompt1754863565929 } from './migration/postgres/1754863565929-RemoveAgentTestPrompt'
import { RemoveAgentRelationToTables1755954192258 } from './migration/postgres/1755954192258-RemoveAgentRelationToTables'
import { AddTriggerNameToTriggerSource1757018269905 } from './migration/postgres/1757018269905-AddTriggerNameToTriggerSource'
import { AddIndexOnTriggerRun1757557714045 } from './migration/postgres/1757557714045-AddIndexOnTriggerRun'
import { DeleteHandshakeFromTriggerSource1758108135968 } from './migration/postgres/1758108135968-DeleteHandshakeFromTriggerSource'

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(AppSystemProp.POSTGRES_USE_SSL)
    if (useSsl === 'true') {
        return {
            ca: system.get(AppSystemProp.POSTGRES_SSL_CA)?.replace(/\\n/g, '\n'),
        }
    }
    return false
}

const getMigrations = (): (new () => MigrationInterface)[] => {
    const commonMigration = [
        FlowAndFileProjectId1674788714498,
        initializeSchema1676238396411,
        encryptCredentials1676505294811,
        removeStoreAction1676649852890,
        billing1677286751592,
        addVersionToPieceSteps1677521257188,
        productEmbed1677894800372,
        addtriggerevents1678621361185,
        removeCollectionVersion1678492809093,
        addEventRouting1678382946390,
        bumpFixPieceVersions1678928503715,
        migrateSchedule1679014156667,
        addNotificationsStatus1680563747425,
        AddInputUiInfo1681107443963,
        CreateWebhookSimulationSchema1680698259291,
        RemoveCollections1680986182074,
        StoreAllPeriods1681019096716,
        AllowNullableStoreEntryAndTrigger1683040965874,
        RenameNotifications1683195711242,
        ListFlowRunsIndices1683199709317,
        ProjectNotifyStatusNotNull1683458275525,
        FlowRunPauseMetadata1683552928243,
        ChangeVariableSyntax1683898241599,
        PieceMetadata1685537054805,
        AddProjectIdToPieceMetadata1686090319016,
        UnifyPieceName1686138629812,
        AddScheduleOptions1687384796637,
        AddAuthToPiecesMetadata1688922241747,
        AddUpdatedByInFlowVersion1689292797727,
        AddTasksToRun1689351564290,
        AddAppConnectionTypeToTopLevel1691703023866,
        AddTagsToRun1692106375081,
        AddFileToPostgres1693004806926,
        AddStatusToConnections1693402930301,
        AddUserMetaInformation1693850082449,
        FixPieceMetadataOrderBug1694367186954,
        FileTypeCompression1694691554696,
        Chatbot1694902537040,
        AddVisibilityStatusToChatbot1695719749099,
        AddPieceTypeAndPackageTypeToPieceMetadata1695992551156,
        AddPieceTypeAndPackageTypeToFlowVersion1696245170061,
        AddArchiveIdToPieceMetadata1696950789636,
        StoreCodeInsideFlow1697969398200,
        AddPlatformToProject1698065083750,
        AddTerminationReason1698323987669,
        ManagedAuthnInitial1698700720482,
        UpdateUserStatusRenameShadowToInvited1699818680567,
        AddPlatformIdToUser1699901161457,
        AddPlatformIdToPieceMetadata1700522340280,
        AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822,
        AddPlatformIdToFile1701807681821,
        RemoveFlowInstance1702379794665,
        RenameAppNameToPieceName1703711596105,
        AddVerifiedAndChangeStatus1703769034497,
        AddTriggerTestStrategy1707087022764,
        AddCategoriesToPieceMetadataPostgres1707231704973,
        AddUniqueStoreConstraint1708521505204,
        SetFlowVersionUpdatedByToNullIfUserIsDeletedPostgres1709641016072,
        MigrateWebhook1709581196563,
        AddAuthorsToPieces1710098373707,
        AddDeletedToProjectPostgres1710243591721,
        MigrateInputUiInfo1711411372480,
        AddProjectUsageColumnToPiece1711768296861,
        AddPieceTags1712107871405,
        RemoveUniqueEmailOnUser1713221809186,
        AddPlatformRoleToUser1713302610746,
        AddUniqueNameToFolder1713643694049,
        AddFeaturesToPlatform1714145914415,
        AddIssueEntityPostgres1714904516114,
        RemoveShowActivityLog1716105958530,
        AddDurationForRuns1716725027424,
        AddAlertsEntityPostgres1716989780835,
        AddUserInvitation1717960689650,
        AddPremiumPiecesColumnPostgres1717370717678,
        AddWorkerMachine1720101280025,
        ChangeEventRoutingConstraint1723549873495,
        AddAnalyticsToPlatform1725113652923,
        RemoveUniqueConstraintOnStepFile1725570317713,
        LogFileRelationWithFlowRun1725639666232,
        AddLogsFileIdIndex1725699690971,
        AddAiProviderTable1726445983043,
        SupportS3Files1726364421096,
        AddUserSessionId1727130193726,
        RemovePremiumPieces1727865841722,
        AddLicenseKeyIntoPlatform1728827704109,
        ChangeProjectUniqueConstraintToPartialIndex1729098769827,
        MigrateSMTPInPlatform1729602169179,
        AddPinnedPieces1729776414647,
        AddConnectionOwner1730123432651,
        AppConnectionsSetNull1730627612799,
        AddFlowSchemaVersion1730760434336,
        SwitchToRouter1731019013340,
        StoreTriggerEventsInFile1731247581852,
        CreateProjectRoleTable1731424289830,
        MigrateConnectionNames1731428722977,
        AddGlobalConnectionsAndRbacForPlatform1731532843905,
        AddIndiciesToRunAndTriggerData1732324567513,
        AddProjectRelationInUserInvitation1732790412900,
        TablesProduct1734355488179,
        RemoveWorkerType1734439097357,
        FieldAndRecordAndCellProjectId1734969829406,
        AddCellUniqueIndex1735057498882,
        AddCopilotSettings1734479886363,
        AddExternalIdForFlow1735262417593,
        AddEnvironmentsEnabled1735267452262,
        AddUserIdentity1735590074879,
        RenameGitRepoPermission1736813103505,
        RestrictPieces1739546878775,
        CreateTableWebhooks1741669458075,
        AddDataColumnToFieldEntity1742395892304,
        AddManualTaskTable1742304857701,
        ChangeManualTasksToTodo1742432827826,
        AddMCP1743128816786,
        RenameApprovalUrlToResolveUrl1742991137557,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994,
        AddLastChangelogDismissed1744053592923,
        AddMcpPiece1744822233873,
        RenameTodoPostiveVariantName1745272231418,
        AddConnectionIdsToFlowVersion1745530653784,
        MakeExternalIdNotNullable1746531094548,
        AddExternalIdForTablesAndFields1746356907629,
        ChangeMcpPieceForeignKey1746543299109,
        AddHandshakeConfigurationToFlow1746848208563,
        AddOrderToFolder1747095861746,
        AddI18nColumnToPieceMetadata1746714836833,
        ChangeExternalIdsForTables1747346473001,
        RenameProjectBillingToPlatformPLan1747819919988,
        UpgradePieceVersionsToLatest1748253670449,
        AddAgentsModule1748456786940,
        ChangeManualTasksCommentsToTodoComments1742433144687,
        AddTodoActivity1748525529096,
        AddCreatedByUserIdInTodo1748565250553,
        AddTodoEnvironment1748573003639,
        DeprecateApproval1748648340742,
        AddMcpToolEntity1748352614033,
        AddMcpRunEntity1748358415599,
        AIProviderRedactorPostgres1748871900624,
        MigrateMcpFlowsToBeTools1748996336492,
        AddMcpToolFlowCascadeDelete1749128866314,
        AIUsagePostgres1750090291551,
        AddAgents1749405724276,
        AddAgentOutput1749859119064,
        RemoveDefaultLocaleFromPlatform1749733527371,
        AddStepToIssuesTable1750017637712,
        MakeStepNameOptional1750025401754,
        RemoveUniqueOnFlow1750093037011,
        ChangeTodoActivityContentFormat1750354589729,
        RevertDescriptionTodoNaming1750389164014,
        RegenerateIssuesTable1750392148590,
        RemoveProjectIdFromIndex1750712746125,
        RevertTodoActivties1751217652277,
        RemoveTerminationReason1751728035816,
        AddFlowVersionToIssue1751927222122,
        SplitUpPieceMetadataIntoTools1752004202722,
        AddIndexForSchemaVersionInFlowVersion1752151941009,
        AddAgentRunsEntityPostgres1752583341290,
        AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028,
        AddAgentIdToTable1753315220453,
        MakeTriggerNullable1753366163403,
        AddIndexForAgentTable1753400133786,
        AddAIUsageMetadatapostgres1753624069238,
        AddExternalIdToAgentId1753641361099,
        AddParentRunIdToFlowRun1753699877817,
        AddCascadeOnAgents1753727379513,
        AddExternalIdToMCPPostgres1753787093467,
        AddExternalidToMCPToolPostgres1754214833292,
        AddTriggerSource1754478770608,
        AddStepNameToTestInFlowRunEntity1754330492027,
        AddJobIdToTriggerRun1754510611628,
        RemoveAgentTestPrompt1754863565929,
        RemoveAgentRelationToTables1755954192258,
        AddIndexToIssues1756775080449,
        AddTriggerNameToTriggerSource1757018269905,
        AddFlowIndexToTriggerSource1757555419075,
        AddIndexOnTriggerRun1757557714045,
        DeleteHandshakeFromTriggerSource1758108135968,
    ]

    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
        case ApEdition.ENTERPRISE:
            commonMigration.push(
                AddTemplates1685538145476,
                AddPinnedAndBlogUrlToTemplates1686133672743,
                AddPinnedOrder1686154285890,
                AddProjectIdToTemplate1688083336934,
                FlowTemplateAddUserIdAndImageUrl1694379223109,
                AddFeaturedDescriptionAndFlagToTemplates1694604120205,
                AddProjectMembers1689177797092,
                ProjectMemberRelations1694381968985,
                AddPlatform1697717995884,
                AddCustomDomain1698077078271,
                AddSigningKey1698602417745,
                AddDisplayNameToSigningKey1698698190965,
                AddOAuth2AppEntiity1699221414907,
                AddFilteredPiecesToPlatform1699281870038,
                AddSmtpAndPrivacyUrlToPlatform1699491705906,
                AddOtpEntity1700396157624,
                AddPlatformDefaultLanguage1700406308445,
                MakeStripeSubscriptionNullable1685053959806,
                AddBillingParameters1688739844617,
                AddTasksPerDays1689336533370,
                RemoveCalculatedMetrics1689806173642,
                ModifyBilling1694902537045,
                RemoveUnusedFieldsinBilling1700132368636,
                AddDatasourcesLimit1695916063833,
                MakeStripeCustomerIdNullable1700751925992,
                AddStateToOtp1701084418793,
                ModifyProjectMembersAndRemoveUserId1701647565290,
                AddApiKeys1701716639135,
                AddEmbeddingFeatureToPlatform1701794452891,
                AddPlatformIdToFlowTemplates1703411318826,
                AddAuthOptionsToPlatform1704667304953,
                AddEnableEmailAuthToPlatform1704797979825,
                AddGitRepoMigrationPostgres1704503804056,
                AddGitSyncEnabledToPlatform1704636362533,
                AddAuditEvents1707614902283,
                CreateActivityTable1708515756040,
                AddLengthLimitsToActivity1708529586342,
                AddShowActivityLogToPlatform1708861032399,
                MakePlatformNotNullable1705969874745,
                AddSlugToGitRepo1709151540095,
                DropUnusedPlatformIndex1709500873378,
                MigrateWebhookTemplate1709581196564,
                AddPlatformForeignKeyToProjectPostgres1709566642531,
                MoveGeneratedByFromSigningKeyToAuditEventPostgres1709669091258,
                AddMappingStateToGit1709753080714,
                CascadeProjectDeleteToActivity1710720610670,
                AddBranchTypeToGit1711073772867,
                PiecesProjectLimits1712279318440,

                // Cloud Only Migrations, before unifing the migrations.
                ChangeToJsonToKeepKeysOrder1685991260335,
                AddPieceTypeAndPackageTypeToFlowTemplate1696245170062,
                RemoveUniqueonAppNameAppCredentials1705586178452,
                CascadeProjectDeleteAppCredentialsAndConnectionKey1710720610669,
                // Enterprise Only Migrations, before unifing the migrations.
                MigrateEeUsersToOldestPlatform1701261357197,
                UnifyEnterpriseWithCloud1714249840058,
                // Cloud Only Entities, But we need to run them for Enterprise as well.
                AddAppSumo1688943462327,
                AddReferral1690459469381,
                AddUserEmailToReferral1709500213947,
                AddProjectBilling1708811745694,

                // New Migration After Unifying
                ModifyProjectMembers1717961669938,
                MigrateAuditEventSchema1723489038729,
                AddAiTokensForProjectPlan1726446092010,
                AddAuditLogIndicies1731711188507,
                AddPlatformBilling1734971881345,
                CreateProjectReleaseTable1734418823028,
                RemoveUnusedProjectBillingFields1736607721367,
                ProjectIdNullableInTemplate1741357285896,
                UpdateNotifyStatusOnEmbedding1741963410825,
                AddManualTaskCommentTable1742305104390,
                AddMetadataFieldToFlowTemplates1744780800000,
                AddLimitsOnPlatformPlan1747921788059,
                AddPlanNameOnPlatformPlan1748549003744,
                AddPlatformIdToAiUsage1750526457504,
                AddBillingCycleDates1750704192423,
                ReplaceTasksLimitWithIncludedTasks1750720173459,
                RenameIncludedTasksToTasksLimit1750722071472,
                AddPaymentMethodToPlatformPlan1751021111433,
                AddAgentsLimitToPlatformPlan1749917984363,
                AddAgentsEnabledToPlatformPlan1751309258332,
                AddTrialFlagInPlatform1751394161203,
                UpdateAiCredits1751404517528,
                AddAiOverageState1751466404493,
                AddLockedColumnToProjectPlan1751878623268,
                AddMcpsEnabled1751989232042,
                AddPlatformAnalyticsReportEntity1753091760355,
                AddBillingCycle1754559781173,
                EligibileForTrial1754852385518,
            )
            break
        case ApEdition.COMMUNITY:
            commonMigration.push(
                AddPlatformToPostgres1709052740378,
                SetNotNullOnPlatform1709505632771,
            )
            break
    }

    return commonMigration
}

const getMigrationConfig = (): MigrationConfig => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return {}
    }

    return {
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigrations(),
    }
}

export const createPostgresDataSource = (): DataSource => {
    const migrationConfig = getMigrationConfig()
    const url = system.get(AppSystemProp.POSTGRES_URL)

    if (!isNil(url)) {
        return new DataSource({
            type: 'postgres',
            url,
            ssl: getSslConfig(),
            ...spreadIfDefined('poolSize', system.get(AppSystemProp.POSTGRES_POOL_SIZE)),
            ...migrationConfig,
            ...commonProperties,
        })
    }

    const database = system.getOrThrow(AppSystemProp.POSTGRES_DATABASE)
    const host = system.getOrThrow(AppSystemProp.POSTGRES_HOST)
    const password = system.getOrThrow(AppSystemProp.POSTGRES_PASSWORD)
    const serializedPort = system.getOrThrow(AppSystemProp.POSTGRES_PORT)
    const port = Number.parseInt(serializedPort, 10)
    const username = system.getOrThrow(AppSystemProp.POSTGRES_USERNAME)

    return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        ssl: getSslConfig(),
        ...spreadIfDefined('poolSize', system.get(AppSystemProp.POSTGRES_POOL_SIZE)),
        ...migrationConfig,
        ...commonProperties,
        extra: {
            idleTimeoutMillis: 5 * 60 * 1000,
        }
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
}
