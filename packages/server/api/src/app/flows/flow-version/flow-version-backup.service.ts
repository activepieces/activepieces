import { 
    FileCompression, 
    FileType, 
    FlowVersion, 
    spreadIfDefined,
} from '@activepieces/shared'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'

const log = system.globalLogger()

export const flowVersionBackupService = {
    async store(flowVersion: FlowVersion): Promise<string> {
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

        log.info({
            flowVersionId: flowVersion.id,
            schemaVersion: flowVersion.schemaVersion,
        }, 'Stored backup version for flow version')

        return file.id
    },
    
    async get(params: GetBackupVersionParams): Promise<FlowVersion | null> {
        const { flowVersion, schemaVersion } = params
        const backupFileId = flowVersion.backupFiles?.[schemaVersion]
        if (!backupFileId) {
            return null
        }
        
        const fileData = await fileService(log).getDataOrThrow({
            fileId: backupFileId,
            type: FileType.FLOW_VERSION_BACKUP,
        })
        
        const backupFlowVersion: FlowVersion = JSON.parse(fileData.data.toString('utf-8'))

        log.info({
            flowVersionId: flowVersion.id,
            schemaVersion,
        }, 'Backup version retrieved for flow version')
        return backupFlowVersion
    },
}

type GetBackupVersionParams = {
    flowVersion: FlowVersion
    schemaVersion: string
}