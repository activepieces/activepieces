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
import { FlowInstanceEntity } from '../flows/flow-instance/flow-instance.entity'
import { FolderEntity } from '../flows/folder/folder.entity'
import { FlowTemplateEntity } from '../ee/flow-template/flow-template.entity'
import { PieceMetadataEntity } from '../pieces/piece-metadata-entity'
import { AppCredentialEntity } from '../ee/app-credentials/app-credentials.entity'
import { ConnectionKeyEntity } from '../ee/connection-keys/connection-key.entity'
import { AppSumoEntity } from '../ee/appsumo/appsumo.entity'
import { ReferralEntity } from '../ee/referrals/referral.entity'
import { createPostgresDataSource } from './postgres-connection'
import { createSqlLiteDatasource } from './sqllite-connection'
import { DatabaseType, system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { ArrayContains, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { StepFileEntity } from '../flows/step-file/step-file.entity'
import { ProjectPlanEntity } from '../ee/billing/plans/plan.entity'
import { ProjectUsageEntity } from '../ee/billing/usage/usage-entity'
import { ChatbotEntity } from '../chatbot/chatbot.entity'
import { ProjectMemberEntity } from '../ee/project-members/project-member.entity'

const databaseType = system.get(SystemProp.DB_TYPE)

const enterprisesEntities = [
    ProjectMemberEntity,
    AppSumoEntity,
    ReferralEntity,
    ChatbotEntity,
    ProjectPlanEntity,
    ProjectUsageEntity,
    FlowTemplateEntity,
    AppCredentialEntity,
    ConnectionKeyEntity,
]

export const commonProperties = {
    subscribers: [],
    entities: [
        ...enterprisesEntities,
        TriggerEventEntity,
        FlowInstanceEntity,
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
        ChatbotEntity,
    ],
    synchronize: false,
}

export const databaseConnection =
    databaseType === DatabaseType.SQLITE3
        ? createSqlLiteDatasource()
        : createPostgresDataSource()

export function APArrayContains<T extends ObjectLiteral>(columnName: string, values: string[], query: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    const databaseType = system.get(SystemProp.DB_TYPE)
    switch (databaseType) {
        case DatabaseType.POSTGRES:
            return query.andWhere({
                [columnName]: ArrayContains(values),
            })
        case DatabaseType.SQLITE3: {
            const likeConditions = values.map((tag, index) => `flow_run.tags LIKE :tag${index}`).join(' AND ')
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