import { TlsOptions } from 'node:tls'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil, spreadIfDefined } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { ChangeExternalIdsForTables1747346473001 } from './migration/common/1747346473001-ChangeExternalIdsForTables'
import { UpgradePieceVersionsToLatest1748253670449 } from './migration/common/1748253670449-UpgradePieceVersionsToLatest'
import { DeprecateApproval1748648340742 } from './migration/common/1748648340742-DeprecateApproval'
import { AddIndexToIssues1756775080449 } from './migration/common/1756775080449-AddIndexToIssues'
import { AddFlowIndexToTriggerSource1757555419075 } from './migration/common/1757555283659-AddFlowIndexToTriggerSource'
import { AddPgLocaleCollation1740031341436 } from './migration/postgres/1740031341436-add-pg-locale-collation'
import { InitialPg1740031656104 } from './migration/postgres/1740031656104-initial-pg'
import { AddFlowTemplate1741587483735 } from './migration/postgres/1741587483735-add-flow-template'
import { AddOauthApp1741683756436 } from './migration/postgres/1741683756436-add-oauth-app'
import { AddGlobalOauthApp1741684926338 } from './migration/postgres/1741684926338-add-global-oauth-app'
import { AddTables1741862762328 } from './migration/postgres/1741862762328-add-tables'
import { AddDataColumnToFieldEntity1742395892304 } from './migration/postgres/1742395892304-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874382959 } from './migration/postgres/1742874382959-add-todos-squashed'
import { RenameApprovalUrlToResolveUrl1742991137557 } from './migration/postgres/1742991137557-RenameApprovalUrlToResolveUrl'
import { AddMCP1743128816786 } from './migration/postgres/1743128816786-AddMCP'
import { AddMetadataFields1743780156664 } from './migration/postgres/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissed1744053592923 } from './migration/postgres/1744053592923-AddLastChangelogDismissed'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994 } from './migration/postgres/1744187975994-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPiece1744822233873 } from './migration/postgres/1744822233873-AddMcpPiece'
import { AddMetadataFlowTemplate1744898816545 } from './migration/postgres/1744898816545-add-metadata-flow-template'
import { RenameTodoPostiveVariantName1745272231418 } from './migration/postgres/1745272231418-RenameTodoPostiveVariantName'
import { AddConnectionIdsToFlowVersion1745530653784 } from './migration/postgres/1745530653784-AddConnectionIdsToFlowVersion'
import { AddExternalIdForTablesAndFields1746356907629 } from './migration/postgres/1746356907629-AddExternalIdForTablesAndFields'
import { MakeExternalIdNotNullable1746531094548 } from './migration/postgres/1746531094548-MakeExternalIdNotNullable'
import { ChangeMcpPieceForeignKey1746543299109 } from './migration/postgres/1746543299109-ChangeMcpPieceForeignKey'
import { AddI18nColumnToPieceMetadata1746714836833 } from './migration/postgres/1746714836833-AddI18nColumnToPieceMetadata'
import { AddHandshakeConfigurationToFlow1746848208563 } from './migration/postgres/1746848208563-AddHandshakeConfigurationToFlow'
import { AddOrderToFolder1747095861746 } from './migration/postgres/1747095861746-AddOrderToFolder'
import { RenameProjectBillingToPlatformPLan1747819919988 } from './migration/postgres/1747819919988-RenameProjectBillingToPlatformPLan'
import { AddMcpToolEntity1748352614033 } from './migration/postgres/1748352614033-AddMcpToolEntity'
import { AddMcpRunEntity1748358415599 } from './migration/postgres/1748358415599-AddMcpRunEntity'
import { AddAgentsModule1748456786940 } from './migration/postgres/1748456786940-AddAgentsModule'
import { AddTodoActivity1748525529096 } from './migration/postgres/1748525529096-AddTodoActivity'
import { AddCreatedByUserIdInTodo1748565250553 } from './migration/postgres/1748565250553-AddCreatedByUserIdInTodo'
import { AddTodoEnvironment1748573003639 } from './migration/postgres/1748573003639-AddTodoEnvironment'
import { AIProviderRedactorPostgres1748871900624 } from './migration/postgres/1748871900624-AIProviderRedactorPostgres.ts'
import { MigrateMcpFlowsToBeTools1748996336492 } from './migration/postgres/1748996336492-MigrateMcpFlowsToBeTools'
import { AddMcpToolFlowCascadeDelete1749128866314 } from './migration/postgres/1749128866314-AddMcpToolFlowCascadeDelete'
import { DefaultMCPServer1749183083485 } from './migration/postgres/1749183083485-DefaultMCPServer'
import { AddAgents1749405724276 } from './migration/postgres/1749405724276-AddAgents'
import { RemoveDefaultLocaleFromPlatform1749733527371 } from './migration/postgres/1749733527371-removeDefaultLocaleFromPlatform'
import { AddAgentOutput1749859119064 } from './migration/postgres/1749859119064-AddAgentOutput'
import { AddFailedStepNameFlowRun1750044840070 } from './migration/postgres/1750044840070-add-failed-step-flow-run'
import { AddIssueEntity1750056987397 } from './migration/postgres/1750056987397-add-issue-entity'
import { AIUsagePostgres1750090291551 } from './migration/postgres/1750090291551-AIUsagePostgres'
import { RemoveUniqueOnFlow1750093037011 } from './migration/postgres/1750093037011-RemoveUniqueOnFlow'
import { RegenerateIssuesTable1750392148590 } from './migration/postgres/1750392148590-RegenerateIssuesTable'
import { AddPlatformIdToAiUsage1750526457504 } from './migration/postgres/1750526457504-AddPlatformIdToAiUsage'
import { ChangeContentTodoActivity1750821502601 } from './migration/postgres/1750821502601-change-content-todo-activity'
import { UpdateAppConnectonIndexes1750821766494 } from './migration/postgres/1750821766494-update-app-connection-indexes'
import { RevertTodoActivties1751217652277 } from './migration/postgres/1751217652277-RevertTodoActivties'
import { RemoveTerminationReason1751728035816 } from './migration/postgres/1751728035816-RemoveTerminationReason'
import { AddFlowVersionToIssue1751927222122 } from './migration/postgres/1751927222122-AddFlowVersionToIssue'
import { AddIndexForSchemaVersionInFlowVersion1752151941009 } from './migration/postgres/1752151941009-AddIndexForSchemaVersionInFlowVersion'
import { AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028 } from './migration/postgres/1752511716028-AddCreatedToFlowVersionFlowIdIdxPostgres'
import { AddAgentRunsEntityPostgres1752583341290 } from './migration/postgres/1752583341290-AddAgentRunsEntityPostgres'

import { ProjectRole1752736911931 } from './migration/postgres/1752736911931-project-role'
import { DefaultProjectRole1752744019509 } from './migration/postgres/1752744019509-default-project-role'
import { AddProjectRoleInvitation1752746415961 } from './migration/postgres/1752746415961-add-project-role-invitation'
import { ProjectMember1752814412946 } from './migration/postgres/1752814412946-project-member'

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
    const commonMigration: (new () => MigrationInterface)[] = [
        DeleteHandshakeFromTriggerSource1758108135968,
        AddFlowIndexToTriggerSource1757555419075,
        AddIndexOnTriggerRun1757557714045,
        AddTriggerNameToTriggerSource1757018269905,
        AddIndexToIssues1756775080449,
        RemoveAgentRelationToTables1755954192258,
        AddStepNameToTestInFlowRunEntity1754330492027,
        RemoveAgentTestPrompt1754863565929,
        AddExternalidToMCPToolPostgres1754214833292,
        AddJobIdToTriggerRun1754510611628,
        AddTriggerSource1754478770608,
        AddExternalIdToMCPPostgres1753787093467,
        AddCascadeOnAgents1753727379513,
        AddParentRunIdToFlowRun1753699877817,
        AddExternalIdToAgentId1753641361099,
        AddAIUsageMetadatapostgres1753624069238,
        AddIndexForAgentTable1753400133786,
        MakeTriggerNullable1753366163403,
        AddAgentIdToTable1753315220453,
        AddAgentRunsEntityPostgres1752583341290,
        AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028,
        ProjectMember1752814412946,
        AddProjectRoleInvitation1752746415961,
        DefaultProjectRole1752744019509,
        ProjectRole1752736911931,
        AddIndexForSchemaVersionInFlowVersion1752151941009,
        AddFlowVersionToIssue1751927222122,
        AddPlatformIdToAiUsage1750526457504,
        RemoveTerminationReason1751728035816,
        RevertTodoActivties1751217652277,
        UpdateAppConnectonIndexes1750821766494,
        ChangeContentTodoActivity1750821502601,
        RegenerateIssuesTable1750392148590,
        AIUsagePostgres1750090291551,
        RemoveUniqueOnFlow1750093037011,
        AddIssueEntity1750056987397,
        AddFailedStepNameFlowRun1750044840070,
        AddAgents1749405724276,
        AddAgentOutput1749859119064,
        RemoveDefaultLocaleFromPlatform1749733527371,
        AddAgentsModule1748456786940,
        AddTodoActivity1748525529096,
        AddCreatedByUserIdInTodo1748565250553,
        AddTodoEnvironment1748573003639,
        DefaultMCPServer1749183083485,
        AddMcpToolFlowCascadeDelete1749128866314,
        AddMcpToolEntity1748352614033,
        AddMcpRunEntity1748358415599,
        AIProviderRedactorPostgres1748871900624,
        MigrateMcpFlowsToBeTools1748996336492,
        DeprecateApproval1748648340742,
        UpgradePieceVersionsToLatest1748253670449,
        RenameProjectBillingToPlatformPLan1747819919988,
        ChangeExternalIdsForTables1747346473001,
        AddI18nColumnToPieceMetadata1746714836833,
        AddOrderToFolder1747095861746,
        AddHandshakeConfigurationToFlow1746848208563,
        ChangeMcpPieceForeignKey1746543299109,
        MakeExternalIdNotNullable1746531094548,
        AddExternalIdForTablesAndFields1746356907629,
        AddConnectionIdsToFlowVersion1745530653784,
        RenameTodoPostiveVariantName1745272231418,
        AddMcpPiece1744822233873,
        AddMetadataFlowTemplate1744898816545,
        AddLastChangelogDismissed1744053592923,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994,
        AddMCP1743128816786,
        RenameApprovalUrlToResolveUrl1742991137557,
        AddTodosSquashed1742874382959,
        AddDataColumnToFieldEntity1742395892304,
        AddTables1741862762328,
        AddGlobalOauthApp1741684926338,
        AddOauthApp1741683756436,
        AddFlowTemplate1741587483735,
        SwitchToRouter1741578250432,
        AddPgLocaleCollation1740031341436,
        InitialPg1740031656104,
    ]

    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
        case ApEdition.ENTERPRISE:
            commonMigration.push()
            break
        case ApEdition.COMMUNITY:
            commonMigration.push()
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
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
}
