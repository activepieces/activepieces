import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import {
    DataSource,
    EntitySchema,
} from 'typeorm'
import { AIProviderEntity } from '../ai/ai-provider-entity'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { UserIdentityEntity } from '../authentication/user-identity/user-identity-entity'
import { AlertEntity } from '../ee/alerts/alerts-entity'
import { PlatformAnalyticsReportEntity } from '../ee/analytics/platform-analytics-report.entity'
import { ApiKeyEntity } from '../ee/api-keys/api-key-entity'
import { AppCredentialEntity } from '../ee/app-credentials/app-credentials.entity'
import { AppSumoEntity } from '../ee/appsumo/appsumo.entity'
import { AuditEventEntity } from '../ee/audit-logs/audit-event-entity'
import { OtpEntity } from '../ee/authentication/otp/otp-entity'
import { ConnectionKeyEntity } from '../ee/connection-keys/connection-key.entity'
import { CustomDomainEntity } from '../ee/custom-domains/custom-domain.entity'
import { FlowTemplateEntity } from '../ee/flow-template/flow-template.entity'
import { OAuthAppEntity } from '../ee/oauth-apps/oauth-app.entity'
import { PlatformPlanEntity } from '../ee/platform/platform-plan/platform-plan.entity'
import { ProjectMemberEntity } from '../ee/projects/project-members/project-member.entity'
import { ProjectPlanEntity } from '../ee/projects/project-plan/project-plan.entity'
import { GitRepoEntity } from '../ee/projects/project-release/git-sync/git-sync.entity'
import { ProjectReleaseEntity } from '../ee/projects/project-release/project-release.entity'
import { ProjectRoleEntity } from '../ee/projects/project-role/project-role.entity'
import { SigningKeyEntity } from '../ee/signing-key/signing-key-entity'
import { FileEntity } from '../file/file.entity'
import { FlagEntity } from '../flags/flag.entity'
import { FlowEntity } from '../flows/flow/flow.entity'
import { FlowRunEntity } from '../flows/flow-run/flow-run-entity'
import { FlowVersionEntity } from '../flows/flow-version/flow-version-entity'
import { FolderEntity } from '../flows/folder/folder.entity'
import { system } from '../helper/system/system'
import { McpServerEntity } from '../mcp/mcp-entity'
import { PieceMetadataEntity } from '../pieces/metadata/piece-metadata-entity'
import { PieceTagEntity } from '../pieces/tags/pieces/piece-tag.entity'
import { TagEntity } from '../pieces/tags/tag-entity'
import { PlatformEntity } from '../platform/platform.entity'
import { ProjectEntity } from '../project/project-entity'
import { StoreEntryEntity } from '../store-entry/store-entry-entity'
import { FieldEntity } from '../tables/field/field.entity'
import { CellEntity } from '../tables/record/cell.entity'
import { RecordEntity } from '../tables/record/record.entity'
import { TableWebhookEntity } from '../tables/table/table-webhook.entity'
import { TableEntity } from '../tables/table/table.entity'
import { TodoActivityEntity } from '../todos/activity/todos-activity.entity'
import { TodoEntity } from '../todos/todo.entity'
import { AppEventRoutingEntity } from '../trigger/app-event-routing/app-event-routing.entity'
import { TriggerEventEntity } from '../trigger/trigger-events/trigger-event.entity'
import { TriggerSourceEntity } from '../trigger/trigger-source/trigger-source-entity'
import { UserEntity } from '../user/user-entity'
import { UserInvitationEntity } from '../user-invitations/user-invitation.entity'
import { createPGliteDataSource } from './pglite-connection'
import { createPostgresDataSource } from './postgres-connection'

const databaseType = system.get(AppSystemProp.DB_TYPE)

function getEntities(): EntitySchema<unknown>[] {
    return [
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
        FolderEntity,
        PieceMetadataEntity,
        PlatformEntity,
        TagEntity,
        PieceTagEntity,
        AlertEntity,
        UserInvitationEntity,
        AIProviderEntity,
        ProjectRoleEntity,
        TableEntity,
        FieldEntity,
        RecordEntity,
        CellEntity,
        TableWebhookEntity,
        UserIdentityEntity,
        TodoEntity,
        McpServerEntity,
        TodoActivityEntity,
        TriggerSourceEntity,
        // Enterprise
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
        ProjectReleaseEntity,
        PlatformAnalyticsReportEntity,
        // CLOUD
        AppSumoEntity,
        ConnectionKeyEntity,
        AppCredentialEntity,
        PlatformPlanEntity,
    ]
}

export const commonProperties = {
    subscribers: [],
    entities: getEntities(),
}

let _databaseConnection: DataSource | null = null

const createDataSource = (): DataSource => {
    switch (databaseType) {
        case DatabaseType.PGLITE:
            return createPGliteDataSource()
        case DatabaseType.POSTGRES:
        default:
            return createPostgresDataSource()
    }
}

export const databaseConnection = (): DataSource => {
    if (isNil(_databaseConnection)) {
        _databaseConnection = createDataSource()
    }
    return _databaseConnection
}
