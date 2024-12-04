import { AppSystemProp, DatabaseType, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil } from '@activepieces/shared'
import {
    ArrayContains,
    DataSource,
    EntitySchema,
    FindOperator,
    Raw,
} from 'typeorm'
import { AiProviderEntity } from '../ai/ai-provider-entity'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { AppEventRoutingEntity } from '../app-event-routing/app-event-routing.entity'
import { AlertEntity } from '../ee/alerts/alerts-entity'
import { ApiKeyEntity } from '../ee/api-keys/api-key-entity'
import { AppCredentialEntity } from '../ee/app-credentials/app-credentials.entity'
import { AuditEventEntity } from '../ee/audit-logs/audit-event-entity'
import { AppSumoEntity } from '../ee/billing/appsumo/appsumo.entity'
import { ProjectBillingEntity } from '../ee/billing/project-billing/project-billing.entity'
import { ConnectionKeyEntity } from '../ee/connection-keys/connection-key.entity'
import { CustomDomainEntity } from '../ee/custom-domains/custom-domain.entity'
import { FlowTemplateEntity } from '../ee/flow-template/flow-template.entity'
import { GitRepoEntity } from '../ee/git-sync/git-sync.entity'
import { IssueEntity } from '../ee/issues/issues-entity'
import { OAuthAppEntity } from '../ee/oauth-apps/oauth-app.entity'
import { OtpEntity } from '../ee/otp/otp-entity'
import { ProjectMemberEntity } from '../ee/project-members/project-member.entity'
import { ProjectPlanEntity } from '../ee/project-plan/project-plan.entity'
import { ProjectRoleEntity } from '../ee/project-role/project-role.entity'
import { ReferralEntity } from '../ee/referrals/referral.entity'
import { SigningKeyEntity } from '../ee/signing-key/signing-key-entity'
import { FileEntity } from '../file/file.entity'
import { FlagEntity } from '../flags/flag.entity'
import { FlowEntity } from '../flows/flow/flow.entity'
import { FlowRunEntity } from '../flows/flow-run/flow-run-entity'
import { FlowVersionEntity } from '../flows/flow-version/flow-version-entity'
import { FolderEntity } from '../flows/folder/folder.entity'
import { TriggerEventEntity } from '../flows/trigger-events/trigger-event.entity'
import { PieceMetadataEntity } from '../pieces/piece-metadata-entity'
import { PlatformEntity } from '../platform/platform.entity'
import { ProjectEntity } from '../project/project-entity'
import { StoreEntryEntity } from '../store-entry/store-entry-entity'
import { PieceTagEntity } from '../tags/pieces/piece-tag.entity'
import { TagEntity } from '../tags/tag-entity'
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
        AlertEntity,
        UserInvitationEntity,
        WorkerMachineEntity,
        AiProviderEntity,
        ProjectRoleEntity,
    ]

    switch (edition) {
        case ApEdition.CLOUD:
        case ApEdition.ENTERPRISE:
            entities.push(
                ProjectMemberEntity,
                ProjectPlanEntity,
                CustomDomainEntity,
                SigningKeyEntity,
                OAuthAppEntity,
                OtpEntity,
                ApiKeyEntity,
                FlowTemplateEntity,
                GitRepoEntity,
                AuditEventEntity,

                // CLOUD
                AppSumoEntity,
                ReferralEntity,
                ConnectionKeyEntity,
                AppCredentialEntity,
                ProjectBillingEntity,
            )
            break
        case ApEdition.COMMUNITY:
            break
        default:
            throw new Error(`Unsupported edition: ${edition}`)
    }

    return entities
}

const getSynchronize = (): boolean => {
    const env = system.getOrThrow<ApEnvironment>(SharedSystemProp.ENVIRONMENT)

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

export function APArrayContains<T>(
    columnName: string,
    values: string[],
): FindOperator<T> {
    const databaseType = system.get(AppSystemProp.DB_TYPE)
    switch (databaseType) {
        case DatabaseType.POSTGRES:
            return ArrayContains(values)
        case DatabaseType.SQLITE3: {
            const likeConditions = values
                .map((_, index) => `${columnName} LIKE :value${index}`)
                .join(' AND ')
            const likeParams = values.reduce((params, value, index) => {
                params[`value${index}`] = `%${value}%`
                return params
            }, {} as Record<string, string>)
            return Raw(_ => `(${likeConditions})`, likeParams)
        }
        default:
            throw new Error(`Unsupported database type: ${databaseType}`)
    }
}

// Uncomment the below line when running `nx db-migration server-api name=<MIGRATION_NAME>` and recomment it after the migration is generated
// export const exportedConnection = databaseConnection()