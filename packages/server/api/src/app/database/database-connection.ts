import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil } from '@activepieces/shared'
import {
    ArrayContains,
    DataSource,
    EntitySchema,
    FindOperator,
    ObjectLiteral,
    Raw,
    SelectQueryBuilder,
} from 'typeorm'
import { AgentEntity } from '../agents/agent-entity'
import { AIProviderEntity } from '../ai/ai-provider-entity'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { AppEventRoutingEntity } from '../app-event-routing/app-event-routing.entity'
import { UserIdentityEntity } from '../authentication/user-identity/user-identity-entity'
// import { AlertEntity } from '../ee/alerts/alerts-entity'
// import { ApiKeyEntity } from '../ee/api-keys/api-key-entity'
// import { AppCredentialEntity } from '../ee/app-credentials/app-credentials.entity'
// import { AppSumoEntity } from '../ee/appsumo/appsumo.entity'
// import { AuditEventEntity } from '../ee/audit-logs/audit-event-entity'
// import { OtpEntity } from '../ee/authentication/otp/otp-entity'
// import { ConnectionKeyEntity } from '../ee/connection-keys/connection-key.entity'
// import { CustomDomainEntity } from '../ee/custom-domains/custom-domain.entity'
// import { FlowTemplateEntity } from '../ee/flow-template/flow-template.entity'
// import { OAuthAppEntity } from '../ee/oauth-apps/oauth-app.entity'
// import { PlatformPlanEntity } from '../ee/platform/platform-plan/platform-plan.entity'
// import { ProjectMemberEntity } from '../ee/projects/project-members/project-member.entity'
// import { ProjectPlanEntity } from '../ee/projects/project-plan/project-plan.entity'
// import { GitRepoEntity } from '../ee/projects/project-release/git-sync/git-sync.entity'
// import { ProjectReleaseEntity } from '../ee/projects/project-release/project-release.entity'
// import { ProjectRoleEntity } from '../ee/projects/project-role/project-role.entity'
// import { SigningKeyEntity } from '../ee/signing-key/signing-key-entity'
import { FileEntity } from '../file/file.entity'
import { FlagEntity } from '../flags/flag.entity'
import { FlowTemplateEntity } from '../flow-templates/flow-template.entity'
import { FlowEntity } from '../flows/flow/flow.entity'
import { FlowRunEntity } from '../flows/flow-run/flow-run-entity'
import { FlowVersionEntity } from '../flows/flow-version/flow-version-entity'
import { FolderEntity } from '../flows/folder/folder.entity'
import { IssueEntity } from '../flows/issues/issues-entity'
import { TriggerEventEntity } from '../flows/trigger-events/trigger-event.entity'
import { DatabaseType, system } from '../helper/system/system'
import { McpEntity } from '../mcp/mcp-entity'
import { McpRunEntity } from '../mcp/mcp-run/mcp-run.entity'
import { McpToolEntity } from '../mcp/tool/mcp-tool.entity'
import { GlobalOAuthAppEntity } from '../oauth-apps/global-oauth-app.entity'
import { OAuthAppEntity } from '../oauth-apps/oauth-app.entity'
import { PieceMetadataEntity } from '../pieces/piece-metadata-entity'
import { PlatformEntity } from '../platform/platform.entity'
import { ProjectEntity } from '../project/project-entity'
import { StoreEntryEntity } from '../store-entry/store-entry-entity'
import { FieldEntity } from '../tables/field/field.entity'
import { CellEntity } from '../tables/record/cell.entity'
import { RecordEntity } from '../tables/record/record.entity'
import { TableWebhookEntity } from '../tables/table/table-webhook.entity'
import { TableEntity } from '../tables/table/table.entity'
import { PieceTagEntity } from '../tags/pieces/piece-tag.entity'
import { TagEntity } from '../tags/tag-entity'
import { TodoActivityEntity } from '../todos/activity/todos-activity.entity'
import { TodoEntity } from '../todos/todo.entity'
import { UserEntity } from '../user/user-entity'
import { UserInvitationEntity } from '../user-invitations/user-invitation.entity'
import { WebhookSimulationEntity } from '../webhooks/webhook-simulation/webhook-simulation-entity'
import { WorkerMachineEntity } from '../workers/machine/machine-entity'
import { createPostgresDataSource } from './postgres-connection'
import { createSqlLiteDataSource } from './sqlite-connection'

const databaseType = system.get(AppSystemProp.DB_TYPE)

function getEntities(): EntitySchema<unknown>[] {
    const edition = system.getEdition()

    const entities: EntitySchema[] = [
        TriggerEventEntity,
        AppEventRoutingEntity,
        FileEntity,
        FlagEntity,
        FlowEntity,
        FlowVersionEntity,
        FlowRunEntity,
        FlowTemplateEntity,
        ProjectEntity,
        StoreEntryEntity,
        UserEntity,
        AppConnectionEntity,
        WebhookSimulationEntity,
        FolderEntity,
        PieceMetadataEntity,
        PlatformEntity,
        TagEntity,
        PieceTagEntity,
        IssueEntity,
        // AlertEntity,
        UserInvitationEntity,
        WorkerMachineEntity,
        AIProviderEntity,
        // ProjectRoleEntity,
        TableEntity,
        FieldEntity,
        RecordEntity,
        CellEntity,
        TableWebhookEntity,
        UserIdentityEntity,
        OAuthAppEntity,
        GlobalOAuthAppEntity,
        TodoEntity,
        McpEntity,
        AgentEntity,
        TodoActivityEntity,
        McpToolEntity,
        McpRunEntity,
    ]

    switch (edition) {
        case ApEdition.CLOUD:
        case ApEdition.ENTERPRISE:
            // entities.push(
            //     ProjectMemberEntity,
            //     ProjectPlanEntity,
            //     CustomDomainEntity,
            //     SigningKeyEntity,
            //     OAuthAppEntity,
            //     OtpEntity,
            //     ApiKeyEntity,
            //     FlowTemplateEntity,
            //     GitRepoEntity,
            //     AuditEventEntity,
            //     ProjectReleaseEntity,

            //     // CLOUD
            //     AppSumoEntity,
            //     ConnectionKeyEntity,
            //     AppCredentialEntity,
            //     PlatformPlanEntity,

            // )
            break
        case ApEdition.COMMUNITY:
            break
        default:
            throw new Error(`Unsupported edition: ${edition}`)
    }

    return entities
}

const getSynchronize = (): boolean => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    const value: Partial<Record<ApEnvironment, boolean>> = {
        [ApEnvironment.TESTING]: true,
    }

    return value[env] ?? false
}

export const commonProperties = {
    subscribers: [],
    entities: getEntities(),
    synchronize: getSynchronize(),
}

let _databaseConnection: DataSource | null = null

export const databaseConnection = () => {
    if (isNil(_databaseConnection)) {
        _databaseConnection = databaseType === DatabaseType.SQLITE3
            ? createSqlLiteDataSource()
            : createPostgresDataSource()
    }
    return _databaseConnection
}

export function getDatabaseType(): DatabaseType {
    return system.getOrThrow<DatabaseType>(AppSystemProp.DB_TYPE)
}


export function AddAPArrayContainsToQueryBuilder<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    columnName: string,
    values: string[],
): void {
    switch (getDatabaseType()) {
        case DatabaseType.POSTGRES:
            queryBuilder.andWhere(`${columnName} @> :values`, { values })
            break
        case DatabaseType.SQLITE3:{
            for (const value of values) {
                queryBuilder.andWhere(`${columnName} LIKE :value${values.indexOf(value)}`, { [`value${values.indexOf(value)}`]: `%${value}%` })
            }
            break
        }
    }
}

export function APArrayContains<T>(
    columnName: string,
    values: string[],
): Record<string, FindOperator<T>> {
    const databaseType = getDatabaseType()
    switch (databaseType) {
        case DatabaseType.POSTGRES:
            return {
                [columnName]: ArrayContains(values),
            }
        case DatabaseType.SQLITE3: {
            const likeConditions = values
                .map((_, index) => `${columnName} LIKE :value${index}`)
                .join(' AND ')
            const likeParams = values.reduce((params, value, index) => {
                params[`value${index}`] = `%${value}%`
                return params
            }, {} as Record<string, string>)
            return {
                [columnName]: Raw(_ => `(${likeConditions})`, likeParams),
            }
        }
        default:
            throw new Error(`Unsupported database type: ${databaseType}`)
    }
}

// Uncomment the below line when running `nx db-migration server-api --name=<MIGRATION_NAME>` and recomment it after the migration is generated
// export const exportedConnection = databaseConnection()
