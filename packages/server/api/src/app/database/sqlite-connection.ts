import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { ChangeExternalIdsForTables1747346473001 } from './migration/common/1747346473001-ChangeExternalIdsForTables'
import { UpgradePieceVersionsToLatest1748253670449 } from './migration/common/1748253670449-UpgradePieceVersionsToLatest'
import { DeprecateApproval1748648340742 } from './migration/common/1748648340742-DeprecateApproval'
import { AddIndexToIssues1756775080449 } from './migration/common/1756775080449-AddIndexToIssues'
import { AddFlowIndexToTriggerSource1757555419075 } from './migration/common/1757555283659-AddFlowIndexToTriggerSource'
import { InitialSqlite1740031972943 } from './migration/sqlite/1740031972943-initial-sqlite'
import { AddFlowTemplate1741588702453 } from './migration/sqlite/1741588702453-add-flow-template'
import { AddOauthApp1741683781609 } from './migration/sqlite/1741683781609-add-oauth-app'
import { AddGlobalOauthApp1741685103864 } from './migration/sqlite/1741685103864-add-global-oauth-app'
import { AddTables1741862813806 } from './migration/sqlite/1741862813806-add-tables'
import { AddDataColumnToFieldEntity1742390870702 } from './migration/sqlite/1742390870702-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874467240 } from './migration/sqlite/1742874467240-add-todos-squashed'
import { RenameApprovalUrlToResolveUrl1742991301509 } from './migration/sqlite/1742991301509-RenameApprovalUrlToResolveUrl'
import { AddMCPSqlite1743127177235 } from './migration/sqlite/1743127177235-AddMCPSqlite'
import { AddMetadataFields1743780156664 } from './migration/sqlite/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissedSQLITE1744053922591 } from './migration/sqlite/1744053922591-AddLastChangelogDismissedSQLITE'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262 } from './migration/sqlite/1744104496262-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPieceSqlite1744822233873 } from './migration/sqlite/1744822233873-AddMcpPieceSqlite'
import { AddMetadataFlowTemplate1744898945629 } from './migration/sqlite/1744898945629-add-metadata-flow-template'
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
import { AddFailedStepNameFlowRun1750045151951 } from './migration/sqlite/1750045151951-add-failed-step-flow-run'
import { AddIssueEntity1750058424539 } from './migration/sqlite/1750058424539-add-issue-entity'
import { AIUsageSqlite1750074241300 } from './migration/sqlite/1750074241300-AIUsageSqlite'
import { RemoveUniqueOnFlowSqlite1750093133906 } from './migration/sqlite/1750093133906-RemoveUniqueOnFlowSqlite'
import { ChangeContentTodoActivity1750822236348 } from './migration/sqlite/1750822236348-change-content-todo-activity'
import { RegenerateIssueTable1750822955988 } from './migration/sqlite/1750822955988-regenerate-issue-table'
import { UpdateAppConnectionIndexes1750823093554 } from './migration/sqlite/1750823093554-update-app-connection-indexes'
import { RevertTodoActivtiesSqlite1751217307674 } from './migration/sqlite/1751217307674-RevertTodoActivtiesSqlite'
import { AddPlatformIdToAIUsageSqlite1751475726665 } from './migration/sqlite/1751475726665-AddPlatformIdToAIUsageSqlite'
import { RemoveTerminationReasonSqlite1751727630516 } from './migration/sqlite/1751727630516-RemoveTerminationReasonSqlite'
import { AddFlowVersionToIssueSqlite1751927149586 } from './migration/sqlite/1751927149586-AddFlowVersionToIssueSqlite'
import { AddIndexForSchemaVersionInFlowVersionSqlite1752152069517 } from './migration/sqlite/1752152069517-AddIndexForSchemaVersionInFlowVersionSqlite'
import { AddAgentRunsEntitySqlite1752583785385 } from './migration/sqlite/1752583785385-AddAgentRunsEntitySqlite'
import { ProjectRole1752743014852 } from './migration/sqlite/1752743014852-project-role'
import { AddProjectRoleInvitation1752746475364 } from './migration/sqlite/1752746475364-add-project-role-invitation'
import { ProjectMember1752814553291 } from './migration/sqlite/1752814553291-project-member'
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
    const communityMigrations: (new () => MigrationInterface)[] = [
        DeleteHandshakeFromTriggerSourceSqlite1758108281602,
        AddFlowIndexToTriggerSource1757555419075,
        AddIndexOnTriggerRunSqlite1757560231246,
        AddTriggerNameToTriggerSourceSqlite1757018637559,
        AddIndexToIssues1756775080449,
        RemoveAgentRelationToTablesSqlite1755954639833,
        AddStepNameToTestInFlowRunEntitySqlite1754355397885,
        RemoveAgentTestPromptSqlite1754863757450,
        AddExternalidToMCPToolSQLite1754220095236,
        AddJobIdToTriggerRun1754510243053,
        AddTriggerSqlite1754477404726,
        AddExternalIdToMCPSqlite1753786833156,
        AddCascadeOnAgentsSqlite1753727589109,
        AddParentRunIdToFlowRunSqlite1753719777841,
        AddExternalAgentIdSqlite1753643287673,
        AddIndexForAgentTableSqlite1753400496920,
        AddTableAutomationStatusSqlite1753013268133,
        AddTableAgentsSqlite1752851142438,
        AddAgentRunsEntitySqlite1752583785385,
        ProjectMember1752814553291,
        AddProjectRoleInvitation1752746475364,
        ProjectRole1752743014852,
        AddIndexForSchemaVersionInFlowVersionSqlite1752152069517,
        AddFlowVersionToIssueSqlite1751927149586,
        RevertTodoActivtiesSqlite1751217307674,
        AddPlatformIdToAIUsageSqlite1751475726665,
        RemoveTerminationReasonSqlite1751727630516,
        UpdateAppConnectionIndexes1750823093554,
        RegenerateIssueTable1750822955988,
        ChangeContentTodoActivity1750822236348,
        AIUsageSqlite1750074241300,
        RemoveUniqueOnFlowSqlite1750093133906,
        AddIssueEntity1750058424539,
        AddFailedStepNameFlowRun1750045151951,
        AddAgentsSqlite1748573768714,
        AddAgentsSqlite1749953500521,
        RemoveDefaultLocaleFromPlatform1749735242946,
        AIProviderRefactorSqlite1748824241409,
        AddMcpToolFlowCascadeDeleteSqlite1749129178686,
        AddMcpToolEntitySQLITE1748365593414,
        AddMcpRunEntitySQLITE1748365786218,
        DeprecateApproval1748648340742,
        UpgradePieceVersionsToLatest1748253670449,
        RemoveFeatureFlagsFromSqlite1747824740845,
        ChangeExternalIdsForTables1747346473001,
        AddI18nColumnToPieceMetadata1746714949131,
        AddFolderDisplayOrder1747062679388,
        AddHandshakeConfigurationToFlowSqlite1746845932780,
        ChangeMcpPieceForeignKey1746543346220,
        MakeExternalIdNotNullableSqlite1746529105649,
        AddExternalIdForTablesAndFieldsSQLITE1746367601605,
        AddConnectionIdsToFlowVersion1745531870426,
        RenameTodoVariantName1745269828603,
        AddMcpPieceSqlite1744822233873,
        AddMetadataFlowTemplate1744898945629,
        AddLastChangelogDismissedSQLITE1744053922591,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262,
        AddMCPSqlite1743127177235,
        RenameApprovalUrlToResolveUrl1742991301509,
        AddTodosSquashed1742874467240,
        AddDataColumnToFieldEntity1742390870702,
        AddTables1741862813806,
        AddGlobalOauthApp1741685103864,
        AddOauthApp1741683781609,
        AddFlowTemplate1741588702453,
        SwitchToRouter1741578250432,
        InitialSqlite1740031972943,
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
