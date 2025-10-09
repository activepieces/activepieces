import { 
    FileCompression, 
    FileType, 
    flowMigrations, 
    FlowVersion, 
    FlowVersionId,
    isNil, 
    LATEST_SCHEMA_VERSION, 
    spreadIfDefined,
    ActivepiecesError,
    ErrorCode,
} from '@activepieces/shared'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { flowVersionRepo } from './flow-version.service'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const migratedFlowVersion: FlowVersion = flowMigrations.apply(flowVersion)
        if (flowVersion.schemaVersion === migratedFlowVersion.schemaVersion) {
            return flowVersion
        }

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await storeBackupFile(flowVersion)
        }
        
        await flowVersionRepo().update(flowVersion.id, {
            schemaVersion: migratedFlowVersion.schemaVersion,
            ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFiles,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },
    
    async getBackupBySchemaVersionOrThrow(params: GetBackupVersionParams): Promise<FlowVersion> {
        const flowVersion = await flowVersionRepo().findOneBy({
            id: params.flowVersionId,
        })
        
        if (isNil(flowVersion)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.flowVersionId,
                    entityType: 'flow_version',
                },
            })
        }
        
        const backupFileId = flowVersion.backupFiles?.[params.schemaVersion]
        
        if (isNil(backupFileId)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `${params.flowVersionId}:${params.schemaVersion}`,
                    entityType: 'flow_version',
                    message: `No backup found for schema version ${params.schemaVersion}`,
                },
            })
        }
        
        const fileData = await fileService(log).getDataOrThrow({
            fileId: backupFileId,
            type: FileType.FLOW_VERSION_BACKUP,
        })
        
        const backupFlowVersion: FlowVersion = JSON.parse(fileData.data.toString('utf-8'))

        log.info(`Backup version ${params.schemaVersion} retrieved for flow version ${params.flowVersionId}`)
        return backupFlowVersion
    },
}

async function storeBackupFile(flowVersion: FlowVersion): Promise<string> {
    const data = Buffer.from(JSON.stringify(flowVersion))
    const file = await fileService(log).save({
        type: FileType.FLOW_VERSION_BACKUP,
        data,
        size: data.length,
        metadata: {
            flowVersionId: flowVersion.id,
            ...spreadIfDefined('schemaVersion', flowVersion.schemaVersion),
        },
        compression: FileCompression.NONE,
    })
    return file.id
}

type GetBackupVersionParams = {
    flowVersionId: FlowVersionId
    schemaVersion: string
}