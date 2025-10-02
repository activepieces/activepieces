import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'

import { AddPieceTypeAndPackageTypeToFlowVersion1696245170061 } from './migration/common/1696245170061-add-piece-type-and-package-type-to-flow-version'
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
import { AddIndexForAppEvents1759392852559 } from './migration/common/1759392852559-AddIndexForAppEvents'
import { InitialSql3Migration1690195839899 } from './migration/sqlite/1690195839899-InitialSql3Migration'
import { AddAppConnectionTypeToTopLevel1691706020626 } from './migration/sqlite/1691706020626-add-app-connection-type-to-top-level'
import { AddTagsToRunSqlite1692056190942 } from './migration/sqlite/1692056190942-AddTagsToRunSqlite'
import { AddStepFileSqlite1692958076906 } from './migration/sqlite/1692958076906-AddStepFileSqlite'
import { AddStatusToConnectionsSqlite1693402376520 } from './migration/sqlite/1693402376520-AddStatusToConnectionsSqlite'
import { AddImageUrlAndTitleToUser1693774053027 } from './migration/sqlite/1693774053027-AddImageUrlAndTitleToUser'
import { FileTypeCompression1694695212159 } from './migration/sqlite/1694695212159-file-type-compression'
import { AddPieceTypeAndPackageTypeToPieceMetadata1696016228398 } from './migration/sqlite/1696016228398-add-piece-type-and-package-type-to-piece-metadata'
import { AddChatBotSqlite1696029443045 } from './migration/sqlite/1696029443045-AddChatBotSqlite'
import { AddArchiveIdToPieceMetadata1696956123632 } from './migration/sqlite/1696956123632-add-archive-id-to-piece-metadata'
import { AddPlatformToProject1698078715730 } from './migration/sqlite/1698078715730-add-platform-to-project'
import { AddTerminationReasonSqlite1698323327318 } from './migration/sqlite/1698323327318-AddTerminationReason'
import { AddExternalIdSqlite1698857968495 } from './migration/sqlite/1698857968495-AddExternalIdSqlite'
import { AddPlatformIdToUserSqlite1700147448410 } from './migration/sqlite/1700147448410-AddPlatformIdToUserSqlite'
import { AddPlatformIdToPieceMetadataSqlite1700524446967 } from './migration/sqlite/1700524446967-AddPlatformIdToPieceMetadataSqlite'
import { AddPlatformIdToFileSqlite1701808264444 } from './migration/sqlite/1701808264444-AddPlatformIdToFileSqlite'
import { RemoveFlowInstanceSqlite1702412280963 } from './migration/sqlite/1702412280963-remove-flow-instance-sqlite'
import { UpdateStatusInUserSqlite1703713027818 } from './migration/sqlite/1703713027818-UpdateStatusInUserSqlite'
import { RenameAppNameToPieceNameSqlite1703713475755 } from './migration/sqlite/1703713475755-RenameAppNameToPieceNameSqlite'
import { AddVerifiedAndChangeStatusSqlite1703768553820 } from './migration/sqlite/1703768553820-AddVerifiedAndChangeStatusSqlite'
import { AddCategoriesToPieceMetadata1707229986819 } from './migration/sqlite/1707229986819-AddCategoriesToPieceMetadata'
import { AddUniqueStoreConstraint1708527446535 } from './migration/sqlite/1708527446535-AddUniqueStoreConstraint'
import { CreateDefaultPlaformSqlite1709051625110 } from './migration/sqlite/1709051625110-CreateDefaultPlaformSqlite'
import { AddPlatformForeignKeyToProjectSqlite1709566629593 } from './migration/sqlite/1709566629593-add-platform-foreign-key-to-project-sqlite'
import { AddAuthorsToPieces1710098009544 } from './migration/sqlite/1710098009544-AddAuthorsToPieces'
import { AddDeletedToProjectSqlite1710248182409 } from './migration/sqlite/1710248182409-add-deleted-to-project-sqlite'
import { AddMissingInputUiInfoSqlite1711412511624 } from './migration/sqlite/1711412511624-AddMissingInputUiInfoSqlite'
import { AddProjectUsageColumnToPieceSqlite1711768479150 } from './migration/sqlite/1711768479150-AddProjectUsageColumnToPieceSqlite'
import { AddTagsToPiecesSqlite1712180673961 } from './migration/sqlite/1712180673961-AddTagsToPiecesSqlite'
import { RemoveUniqueEmailOnUser1713222892743 } from './migration/sqlite/1713222892743-RemoveUniqueEmailOnUser'
import { AddPlatformRole1713271221154 } from './migration/sqlite/1713271221154-AddPlatformRole'
import { AddUniqueNameToFolderSqlite1713645171373 } from './migration/sqlite/1713645171373-AddUniqueNameToFolderSqlite'
import { AddFeatureFlagsToPlatform1714137103728 } from './migration/sqlite/1714137103728-AddFeatureFlagsToPlatform'
import { AddIssueEntitySqlite1714900626443 } from './migration/sqlite/1714900626443-AddIssueEntitySqlite'
import { AddAlertsEntitySqlite1717239613259 } from './migration/sqlite/1717239613259-AddAlertsEntitySqlite'
import { AddPremiumPiecesColumnSqlite1717443603235 } from './migration/sqlite/1717443603235-AddPremiumPiecesColumnSqlite'
import { AddUserInvitationSqlite1717943564437 } from './migration/sqlite/1717943564437-AddUserInvitationSqlite'
import { AddWorkerMachineSqlite1720100928449 } from './migration/sqlite/1720100928449-AddWorkerMachineSqlite'
import { AddAnalyticsToPlatformSqlite1725151368300 } from './migration/sqlite/1725151368300-AddAnalyticsToPlatformSqlite'
import { LogFileRelationWithFlowRunSqlite1725637505836 } from './migration/sqlite/1725637505836-LogFileRelationWithFlowRunSqlite'
import { AddLogsFileIdIndexSqlite1725699920020 } from './migration/sqlite/1725699920020-AddLogsFileIdIndexSqlite'
import { SupportS3FilesSqlite1726363932745 } from './migration/sqlite/1726363932745-SupportS3FilesSqlite'
import { AddAiProviderSqlite1726446345221 } from './migration/sqlite/1726446345221-AddAiProviderSqlite'
import { RemovePremiumPiecesSqlite1727865697005 } from './migration/sqlite/1727865697005-RemovePremiumPiecesSqlite'
import { UpdatePlaformInSqlite1729330108485 } from './migration/sqlite/1729330108485-UpdatePlaformInSqlite'
import { MigrateSMTPInPlatformSqlite1729601402320 } from './migration/sqlite/1729601402320-MigrateSMTPInPlatformSqlite'
import { AddPinnedPiecesSqlite1729774033945 } from './migration/sqlite/1729774033945-AddPinnedPiecesSqlite'
import { AddConnectionOwnerSqlite1730121414658 } from './migration/sqlite/1730121414658-AddConnectionOwnerSqlite'
import { AppConnectionsSetNullSqlite1730627777709 } from './migration/sqlite/1730627777709-AppConnectionsSetNullSqlite'
import { AddFlowSchemaVersionSqlite1730760312426 } from './migration/sqlite/1730760312426-AddFlowSchemaVersionSqlite'
import { StoreTriggerEventsInFileSqlite1731247180217 } from './migration/sqlite/1731247180217-StoreTriggerEventsInFileSqlite'
import { MigrateConnectionNamesSqlite1731443310900 } from './migration/sqlite/1731443310900-MigrateConnectionNamesSqlite'
import { AddGlobalConnectionsAndRbacForPlatformSqlite1731604290560 } from './migration/sqlite/1731604290560-AddGlobalConnectionsAndRbacForPlatformSqlite'
import { AddIndiciesToTriggerEventSqlite1732324359348 } from './migration/sqlite/1732324359348-AddIndiciesToTriggerEventSqlite'
import { AddIndiciesToRunSqlite1732324481815 } from './migration/sqlite/1732324481815-AddIndiciesToRunSqlite'
import { CreateProjectRoleTableSqlite1732482844483 } from './migration/sqlite/1732482844483-CreateProjectRoleTableSqlite'
import { AddProjectRelationInUserInvitationSqlite1732791068873 } from './migration/sqlite/1732791068873-AddProjectRelationInUserInvitationSqlite'
import { TablesProductSqlite1734354249984 } from './migration/sqlite/1734354249984-TablesProductSqlite'
import { RemoveWorkerTypeSqlite1734439194575 } from './migration/sqlite/1734439194575-RemoveWorkerTypeSqlite'
import { AddCopilotSettingsSqlite1734479435668 } from './migration/sqlite/1734479435668-AddCopilotSettingsSqlite'
import { FieldAndRecordAndCellProjectId1734967659746 } from './migration/sqlite/1734967659746-FieldAndRecordAndCell_ProjectIdSqlite'
import { AddCellUniqueIndex1735057433052 } from './migration/sqlite/1735057433052-AddCellUniqueIndexSqlite'
import { AddExternalIdForFlowSqlite1735262810939 } from './migration/sqlite/1735262810939-AddExternalIdForFlowSqlite'
import { AddUserIdentitySqlite1735602676499 } from './migration/sqlite/1735602676499-AddUserIdentitySqlite'
import { TableWebhooksSqlite1737550783153 } from './migration/sqlite/1737550783153-TableWebhooksSqlite'
import { RestrictPiecesSqlite1739544872722 } from './migration/sqlite/1739544872722-RestrictPiecesSqlite'
import { TableWebhooksIsArraySqlite1741668828922 } from './migration/sqlite/1741668828922-TableWebhooksIsArraySqlite'
import { AddManualTaskTable1742304913465 } from './migration/sqlite/1742304913465-AddManualTaskTable'
import { AddDataColumnToFieldEntity1742390870702 } from './migration/sqlite/1742390870702-AddDataColumnToFieldEntity'
import { ChangeManualTasksToTodoSqlite1742432169253 } from './migration/sqlite/1742432169253-ChangeManualTasksToTodoSqlite'
import { RenameApprovalUrlToResolveUrl1742991301509 } from './migration/sqlite/1742991301509-RenameApprovalUrlToResolveUrl'
import { AddMCPSqlite1743127177235 } from './migration/sqlite/1743127177235-AddMCPSqlite'
import { AddMetadataFields1743780156664 } from './migration/sqlite/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissedSQLITE1744053922591 } from './migration/sqlite/1744053922591-AddLastChangelogDismissedSQLITE'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262 } from './migration/sqlite/1744104496262-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPieceSqlite1744822233873 } from './migration/sqlite/1744822233873-AddMcpPieceSqlite'
import { RenameTodoVariantName1745269828603 } from './migration/sqlite/1745269828603-RenameTodoVariantName'
import { AddConnectionIdsToFlowVersion1745531870426 } from './migration/sqlite/1745531870426-AddConnectionIdsToFlowVersion'
import { AddExternalIdForTablesAndFieldsSQLITE1746367601605 } from './migration/sqlite/1746367601605-AddExternalIdForTablesAndFieldsSQLITE'
import { MakeExternalIdNotNullableSqlite1746529105649 } from './migration/sqlite/1746529105649-MakeExternalIdNotNullableSqlite'
import { ChangeMcpPieceForeignKey1746543346220 } from './migration/sqlite/1746543346220-ChangeMcpPieceForeignKey'
import { AddI18nColumnToPieceMetadata1746714949131 } from './migration/sqlite/1746714949131-AddI18nColumnToPieceMetadata'
import { AddHandshakeConfigurationToFlowSqlite1746845932780 } from './migration/sqlite/1746845932780-AddHandshakeConfigurationToFlowSqlite'
import { AddFolderDisplayOrder1747062679388 } from './migration/sqlite/1747062679388-AddFolderDisplayOrder'
import { RemoveFeatureFlagsFromSqlite1747824740845 } from './migration/sqlite/1747824740845-RemoveFeatureFlagsFromSqlite'
import { AddMcpToolEntitySQLITE1748365593414 } from './migration/sqlite/1748365593414-AddMcpToolEntitySQLITE'
import { AddMcpRunEntitySQLITE1748365786218 } from './migration/sqlite/1748365786218-AddMcpRunEntitySQLITE'
import { AddAgentsSqlite1748573768714 } from './migration/sqlite/1748573768714-AddAgentsSqlite'
import { AIProviderRefactorSqlite1748824241409 } from './migration/sqlite/1748824241409-AIProviderRefactorSqlite'
import { AddMcpToolFlowCascadeDeleteSqlite1749129178686 } from './migration/sqlite/1749129178686-AddMcpToolFlowCascadeDeleteSqlite'
import { RemoveDefaultLocaleFromPlatform1749735242946 } from './migration/sqlite/1749735242946-removeDefaultLocaleFromPlatform'
import { AddAgentsSqlite1749953500521 } from './migration/sqlite/1749953500521-AddAgentsSqlite'
import { AddStepToIssuesTableSqlite1750017482244 } from './migration/sqlite/1750017482244-AddStepToIssuesTableSqlite'
import { MakeStepNameOptionalSqlite1750025280435 } from './migration/sqlite/1750025280435-MakeStepNameOptionalSqlite'
import { AIUsageSqlite1750074241300 } from './migration/sqlite/1750074241300-AIUsageSqlite'
import { RemoveUniqueOnFlowSqlite1750093133906 } from './migration/sqlite/1750093133906-RemoveUniqueOnFlowSqlite'
import { ChangeTodoActivityContentFormatSqlite1750364494659 } from './migration/sqlite/1750364494659-ChangeTodoActivityContentFormatSqlite'
import { RevertDescriptionTodoNamingSqlite1750391313307 } from './migration/sqlite/1750391313307-RevertDescriptionTodoNamingSqlite'
import { RegenerateIssuesTable1750391974657 } from './migration/sqlite/1750391974657-RegenerateIssuesTable'
import { RevertTodoActivtiesSqlite1751217307674 } from './migration/sqlite/1751217307674-RevertTodoActivtiesSqlite'
import { AddPlatformIdToAIUsageSqlite1751475726665 } from './migration/sqlite/1751475726665-AddPlatformIdToAIUsageSqlite'
import { RemoveTerminationReasonSqlite1751727630516 } from './migration/sqlite/1751727630516-RemoveTerminationReasonSqlite'
import { AddFlowVersionToIssueSqlite1751927149586 } from './migration/sqlite/1751927149586-AddFlowVersionToIssueSqlite'
import { AddIndexForSchemaVersionInFlowVersionSqlite1752152069517 } from './migration/sqlite/1752152069517-AddIndexForSchemaVersionInFlowVersionSqlite'
import { AddAgentRunsEntitySqlite1752583785385 } from './migration/sqlite/1752583785385-AddAgentRunsEntitySqlite'
import { AddTableAgentsSqlite1752851142438 } from './migration/sqlite/1752851142438-AddTableAgentsSqlite'
import { AddTableAutomationStatusSqlite1753013268133 } from './migration/sqlite/1753013268133-AddTableAutomationStatusSqlite'
import { AddIndexForAgentTableSqlite1753400496920 } from './migration/sqlite/1753400496920-AddIndexForAgentTableSqlite'
import { AddExternalAgentIdSqlite1753643287673 } from './migration/sqlite/1753643287673-AddExternalAgentIdSqlite'
import { AddParentRunIdToFlowRunSqlite1753719777841 } from './migration/sqlite/1753719777841-AddParentRunIdToFlowRunSqlite'
import { AddCascadeOnAgentsSqlite1753727589109 } from './migration/sqlite/1753727589109-AddCascadeOnAgentsSqlite'
import { AddExternalIdToMCPSqlite1753786833156 } from './migration/sqlite/1753786833156-AddExternalIdToMCPSqlite'
import { AddExternalidToMCPToolSQLite1754220095236 } from './migration/sqlite/1754220095236-AddExternalidToMCPToolSQLite'
import { AddStepNameToTestInFlowRunEntitySqlite1754355397885 } from './migration/sqlite/1754355397885-AddStepNameToTestInFlowRunEntitySqlite'
import { AddTriggerSqlite1754477404726 } from './migration/sqlite/1754477404726-AddTriggerSqlite'
import { AddJobIdToTriggerRun1754510243053 } from './migration/sqlite/1754510243053-AddJobIdToTriggerRun'
import { RemoveAgentTestPromptSqlite1754863757450 } from './migration/sqlite/1754863757450-RemoveAgentTestPromptSqlite'
import { RemoveAgentRelationToTablesSqlite1755954639833 } from './migration/sqlite/1755954639833-RemoveAgentRelationToTablesSqlite'
import { AddTriggerNameToTriggerSourceSqlite1757018637559 } from './migration/sqlite/1757018637559-AddTriggerNameToTriggerSourceSqlite'
import { AddIndexOnTriggerRunSqlite1757560231246 } from './migration/sqlite/1757560231246-AddIndexOnTriggerRunSqlite'
import { AddFlowContextToFlowVersionSqlite1756341633972 } from './migration/sqlite/1756341633972-AddFlowContextToFlowVersionSqlite'
import { DeleteHandshakeFromTriggerSourceSqlite1758108281602 } from './migration/sqlite/1758108281602-DeleteHandshakeFromTriggerSourceSqlite'

const getSqliteDatabaseFilePath = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    mkdirSync(apConfigDirectoryPath, { recursive: true })
    return path.resolve(path.join(apConfigDirectoryPath, 'database.sqlite'))
}

const getSqliteDatabaseInMemory = (): string => {
    return ':memory:'
}

const getSqliteDatabase = (): string => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return getSqliteDatabaseInMemory()
    }
    return getSqliteDatabaseFilePath()
}

const getMigrations = (): (new () => MigrationInterface)[] => {
    const communityMigrations = [
        InitialSql3Migration1690195839899,
        AddAppConnectionTypeToTopLevel1691706020626,
        AddTagsToRunSqlite1692056190942,
        AddStepFileSqlite1692958076906,
        AddStatusToConnectionsSqlite1693402376520,
        AddImageUrlAndTitleToUser1693774053027,
        AddChatBotSqlite1696029443045,
        FileTypeCompression1694695212159,
        AddPieceTypeAndPackageTypeToPieceMetadata1696016228398,
        AddPieceTypeAndPackageTypeToFlowVersion1696245170061,
        AddArchiveIdToPieceMetadata1696956123632,
        StoreCodeInsideFlow1697969398200,
        AddPlatformToProject1698078715730,
        AddTerminationReasonSqlite1698323327318,
        AddExternalIdSqlite1698857968495,
        UpdateUserStatusRenameShadowToInvited1699818680567,
        AddPlatformIdToUserSqlite1700147448410,
        AddPlatformIdToPieceMetadataSqlite1700524446967,
        AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822,
        AddPlatformIdToFileSqlite1701808264444,
        RemoveFlowInstanceSqlite1702412280963,
        UpdateStatusInUserSqlite1703713027818,
        RenameAppNameToPieceNameSqlite1703713475755,
        AddVerifiedAndChangeStatusSqlite1703768553820,
        AddTriggerTestStrategy1707087022764,
        AddCategoriesToPieceMetadata1707229986819,
        AddUniqueStoreConstraint1708527446535,
        CreateDefaultPlaformSqlite1709051625110,
        MigrateWebhook1709581196563,
        AddPlatformForeignKeyToProjectSqlite1709566629593,
        AddAuthorsToPieces1710098009544,
        AddDeletedToProjectSqlite1710248182409,
        AddMissingInputUiInfoSqlite1711412511624,
        AddProjectUsageColumnToPieceSqlite1711768479150,
        AddTagsToPiecesSqlite1712180673961,
        RemoveUniqueEmailOnUser1713222892743,
        AddPlatformRole1713271221154,
        AddUniqueNameToFolderSqlite1713645171373,
        AddFeatureFlagsToPlatform1714137103728,
        AddIssueEntitySqlite1714900626443,
        RemoveShowActivityLog1716105958530,
        AddDurationForRuns1716725027424,
        AddAlertsEntitySqlite1717239613259,
        AddUserInvitationSqlite1717943564437,
        AddPremiumPiecesColumnSqlite1717443603235,
        AddWorkerMachineSqlite1720100928449,
        ChangeEventRoutingConstraint1723549873495,
        AddAnalyticsToPlatformSqlite1725151368300,
        RemoveUniqueConstraintOnStepFile1725570317713,
        LogFileRelationWithFlowRunSqlite1725637505836,
        AddLogsFileIdIndexSqlite1725699920020,
        AddAiProviderSqlite1726446345221,
        SupportS3FilesSqlite1726363932745,
        AddUserSessionId1727130193726,
        RemovePremiumPiecesSqlite1727865697005,
        AddLicenseKeyIntoPlatform1728827704109,
        UpdatePlaformInSqlite1729330108485,
        ChangeProjectUniqueConstraintToPartialIndex1729098769827,
        MigrateSMTPInPlatformSqlite1729601402320,
        AddPinnedPiecesSqlite1729774033945,
        AddConnectionOwnerSqlite1730121414658,
        AppConnectionsSetNullSqlite1730627777709,
        AddFlowSchemaVersionSqlite1730760312426,
        SwitchToRouter1731019013340,
        StoreTriggerEventsInFileSqlite1731247180217,
        CreateProjectRoleTableSqlite1732482844483,
        MigrateConnectionNamesSqlite1731443310900,
        AddGlobalConnectionsAndRbacForPlatformSqlite1731604290560,
        AddIndiciesToTriggerEventSqlite1732324359348,
        AddIndiciesToRunSqlite1732324481815,
        AddProjectRelationInUserInvitationSqlite1732791068873,
        TablesProductSqlite1734354249984,
        RemoveWorkerTypeSqlite1734439194575,
        FieldAndRecordAndCellProjectId1734967659746,
        AddCellUniqueIndex1735057433052,
        TableWebhooksSqlite1737550783153,
        AddCopilotSettingsSqlite1734479435668,
        AddExternalIdForFlowSqlite1735262810939,
        AddUserIdentitySqlite1735602676499,
        RestrictPiecesSqlite1739544872722,
        TableWebhooksIsArraySqlite1741668828922,
        AddDataColumnToFieldEntity1742390870702,
        AddManualTaskTable1742304913465,
        ChangeManualTasksToTodoSqlite1742432169253,
        AddMCPSqlite1743127177235,
        RenameApprovalUrlToResolveUrl1742991301509,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262,
        AddLastChangelogDismissedSQLITE1744053922591,
        AddMcpPieceSqlite1744822233873,
        RenameTodoVariantName1745269828603,
        AddConnectionIdsToFlowVersion1745531870426,
        MakeExternalIdNotNullableSqlite1746529105649,
        AddExternalIdForTablesAndFieldsSQLITE1746367601605,
        ChangeMcpPieceForeignKey1746543346220,
        AddHandshakeConfigurationToFlowSqlite1746845932780,
        AddFolderDisplayOrder1747062679388,
        AddI18nColumnToPieceMetadata1746714949131,
        ChangeExternalIdsForTables1747346473001,
        RemoveFeatureFlagsFromSqlite1747824740845,
        UpgradePieceVersionsToLatest1748253670449,
        AddAgentsSqlite1748573768714,
        DeprecateApproval1748648340742,
        AddMcpToolEntitySQLITE1748365593414,
        AddMcpRunEntitySQLITE1748365786218,
        AIProviderRefactorSqlite1748824241409,
        AddMcpToolFlowCascadeDeleteSqlite1749129178686,
        AIUsageSqlite1750074241300,
        AddAgentsSqlite1749953500521,
        RemoveDefaultLocaleFromPlatform1749735242946,
        AddStepToIssuesTableSqlite1750017482244,
        MakeStepNameOptionalSqlite1750025280435,
        RemoveUniqueOnFlowSqlite1750093133906,
        ChangeTodoActivityContentFormatSqlite1750364494659,
        RevertDescriptionTodoNamingSqlite1750391313307,
        RegenerateIssuesTable1750391974657,
        RemoveProjectIdFromIndex1750712746125,
        RevertTodoActivtiesSqlite1751217307674,
        AddPlatformIdToAIUsageSqlite1751475726665,
        RemoveTerminationReasonSqlite1751727630516,
        AddFlowVersionToIssueSqlite1751927149586,
        SplitUpPieceMetadataIntoTools1752004202722,
        AddIndexForSchemaVersionInFlowVersionSqlite1752152069517,
        AddAgentRunsEntitySqlite1752583785385,
        AddTableAgentsSqlite1752851142438,
        AddTableAutomationStatusSqlite1753013268133,
        AddIndexForAgentTableSqlite1753400496920,
        AddExternalAgentIdSqlite1753643287673,
        AddParentRunIdToFlowRunSqlite1753719777841,
        AddCascadeOnAgentsSqlite1753727589109,
        AddExternalIdToMCPSqlite1753786833156,
        AddExternalidToMCPToolSQLite1754220095236,
        AddTriggerSqlite1754477404726,
        AddStepNameToTestInFlowRunEntitySqlite1754355397885,
        AddJobIdToTriggerRun1754510243053,
        RemoveAgentTestPromptSqlite1754863757450,
        RemoveAgentRelationToTablesSqlite1755954639833,
        AddIndexToIssues1756775080449,
        AddTriggerNameToTriggerSourceSqlite1757018637559,
        AddFlowIndexToTriggerSource1757555419075,
        AddIndexOnTriggerRunSqlite1757560231246,
        DeleteHandshakeFromTriggerSourceSqlite1758108281602,
        AddIndexForAppEvents1759392852559,
        AddFlowContextToFlowVersionSqlite1756341633972,
    ]
    const edition = system.getEdition()
    if (edition !== ApEdition.COMMUNITY) {
        throw new Error(`Edition ${edition} not supported in sqlite3 mode`)
    }
    return communityMigrations
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

export const createSqlLiteDataSource = (): DataSource => {
    const migrationConfig = getMigrationConfig()

    return new DataSource({
        type: 'sqlite',
        database: getSqliteDatabase(),
        ...migrationConfig,
        ...commonProperties,
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
}

