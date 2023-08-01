import { DataSource } from 'typeorm'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { TlsOptions } from 'node:tls'
import { FlowAndFileProjectId1674788714498 } from './migration/postgres/1674788714498-FlowAndFileProjectId'
import { initializeSchema1676238396411 } from './migration/postgres/1676238396411-initialize-schema'
import { removeStoreAction1676649852890 } from './migration/postgres/1676649852890-remove-store-action'
import { encryptCredentials1676505294811 } from './migration/postgres/1676505294811-encrypt-credentials'
import { billing1677286751592 } from './migration/postgres/1677286751592-billing'
import { addVersionToPieceSteps1677521257188 } from './migration/postgres/1677521257188-add-version-to-piece-steps'
import { productEmbed1677894800372 } from './migration/postgres/1677894800372-product-embed'
import { addtriggerevents1678621361185 } from './migration/postgres/1678621361185-addtriggerevents'
import { removeCollectionVersion1678492809093 } from './migration/postgres/1678492809093-removeCollectionVersion'
import { addEventRouting1678382946390 } from './migration/postgres/1678382946390-add-event-routing'
import { bumpFixPieceVersions1678928503715 } from './migration/postgres/1678928503715-bump-fix-piece-versions'
import { migrateSchedule1679014156667 } from './migration/postgres/1679014156667-migrate-schedule'
import { addNotificationsStatus1680563747425 } from './migration/postgres/1680563747425-add-notifications-status'
import { AddInputUiInfo1681107443963 } from './migration/postgres/1681107443963-AddInputUiInfo'
import { CreateWebhookSimulationSchema1680698259291 } from './migration/postgres/1680698259291-create-webhook-simulation-schema'
import { RemoveCollections1680986182074 } from './migration/postgres/1680986182074-RemoveCollections'
import { StoreAllPeriods1681019096716 } from './migration/postgres/1681019096716-StoreAllPeriods'
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
import { AddAuthToPiecesMetadata1688922241747 } from './migration/postgres//1688922241747-AddAuthToPiecesMetadata'
import { AddUpdatedByInFlowVersion1689292797727 } from './migration/postgres/1689292797727-AddUpdatedByInFlowVersion'
import { AddTasksToRun1689351564290 } from './migration/postgres/1689351564290-AddTasksToRun'
import { commonProperties } from './database-connection'

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(SystemProp.POSTGRES_USE_SSL)

    if (useSsl === 'true') {
        return {
            ca: system.get(SystemProp.POSTGRES_SSL_CA),
        }
    }

    return false
}

export const createPostgresDataSource = () => {

    const database = system.getOrThrow(SystemProp.POSTGRES_DATABASE)
    const host = system.getOrThrow(SystemProp.POSTGRES_HOST)
    const password = system.getOrThrow(SystemProp.POSTGRES_PASSWORD)
    const serializedPort = system.getOrThrow(SystemProp.POSTGRES_PORT)
    const port = Number.parseInt(serializedPort, 10)
    const username = system.getOrThrow(SystemProp.POSTGRES_USERNAME)

    return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        ssl: getSslConfig(),
        migrations: [
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
        ],
        ...commonProperties,
    })
}