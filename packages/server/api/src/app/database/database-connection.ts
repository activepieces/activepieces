import { UserEntity } from '../user/user-entity'
import { ProjectEntity } from '../project/project-entity'
import { FlowEntity } from '../flows/flow/flow.entity'
import { FlowVersionEntity } from '../flows/flow-version/flow-version-entity'
import { FileEntity } from '../file/file.entity'
import { StoreEntryEntity } from '../store-entry/store-entry-entity'
import { FlowRunEntity } from '../flows/flow-run/flow-run-entity'
import { FlagEntity } from '../flags/flag.entity'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { AppEventRoutingEntity } from '../app-event-routing/app-event-routing.entity'
import { TriggerEventEntity } from '../flows/trigger-events/trigger-event.entity'
import { WebhookSimulationEntity } from '../webhooks/webhook-simulation/webhook-simulation-entity'
import { FolderEntity } from '../flows/folder/folder.entity'
import { FlowTemplateEntity } from '../ee/flow-template/flow-template.entity'
import { PieceMetadataEntity } from '../pieces/piece-metadata-entity'
import { AppCredentialEntity } from '../ee/app-credentials/app-credentials.entity'
import { ConnectionKeyEntity } from '../ee/connection-keys/connection-key.entity'
import { ReferralEntity } from '../ee/referrals/referral.entity'
import { createPostgresDataSource } from './postgres-connection'
import { createSqlLiteDataSource } from './sqlite-connection'
import { DatabaseType, SystemProp, system } from 'server-shared'
import {
    ArrayContains,
    EntitySchema,
    ObjectLiteral,
    SelectQueryBuilder,
} from 'typeorm'
import { StepFileEntity } from '../flows/step-file/step-file.entity'
import { ProjectMemberEntity } from '../ee/project-members/project-member.entity'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { CustomDomainEntity } from '../ee/custom-domains/custom-domain.entity'
import { PlatformEntity } from '../platform/platform.entity'
import { SigningKeyEntity } from '../ee/signing-key/signing-key-entity'
import { OAuthAppEntity } from '../ee/oauth-apps/oauth-app.entity'
import { OtpEntity } from '../ee/otp/otp-entity'
import { ApiKeyEntity } from '../ee/api-keys/api-key-entity'
import { AuditEventEntity } from '../ee/audit-logs/audit-event-entity'
import { ActivityEntity } from '../ee/activity/activity-entity'
import { ProjectBillingEntity } from '../ee/billing/project-billing/project-billing.entity'
import { ProjectPlanEntity } from '../ee/project-plan/project-plan.entity'
import { AppSumoEntity } from '../ee/billing/appsumo/appsumo.entity'
import { GitRepoEntity } from '../ee/git-repos/git-repo.entity'

const databaseType = system.get(SystemProp.DB_TYPE)

function getEntities(): EntitySchema<unknown>[] {
    const edition = getEdition()

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
        StepFileEntity,
        PlatformEntity,
    ]

    switch (edition) {
        case ApEdition.CLOUD:
            entities.push(
                ProjectMemberEntity,
                AppSumoEntity,
                ReferralEntity,
                ProjectPlanEntity,
                FlowTemplateEntity,
                ConnectionKeyEntity,
                AppCredentialEntity,
                CustomDomainEntity,
                SigningKeyEntity,
                OAuthAppEntity,
                OtpEntity,
                ApiKeyEntity,
                GitRepoEntity,
                AuditEventEntity,
                ActivityEntity,
                ProjectBillingEntity,
            )
            break
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
                ActivityEntity,
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
    const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

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

export const databaseConnection =
  databaseType === DatabaseType.SQLITE3
      ? createSqlLiteDataSource()
      : createPostgresDataSource()

export function APArrayContains<T extends ObjectLiteral>(
    columnName: string,
    values: string[],
    query: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> {
    const databaseType = system.get(SystemProp.DB_TYPE)
    switch (databaseType) {
        case DatabaseType.POSTGRES:
            return query.andWhere({
                [columnName]: ArrayContains(values),
            })
        case DatabaseType.SQLITE3: {
            const likeConditions = values
                .map((tag, index) => `flow_run.tags LIKE :tag${index}`)
                .join(' AND ')
            const likeParams = values.reduce((params, tag, index) => {
                return {
                    ...params,
                    [`tag${index}`]: `%${tag}%`,
                }
            }, {})
            return query.andWhere(likeConditions, likeParams)
        }
        default:
            throw new Error(`Unsupported database type: ${databaseType}`)
    }
}
