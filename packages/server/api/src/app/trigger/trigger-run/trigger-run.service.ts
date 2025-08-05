import { apId, FileCompression, FileType, ProjectId, TriggerRun, TriggerRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { projectService } from '../../project/project-service'
import { TriggerRunEntity } from './trigger-run.entity'

const triggerRunRepo = repoFactory(TriggerRunEntity)

export const triggerRunService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<TriggerRun> {
        const { projectId, triggerSourceId, status, payload, error } = params
        const buffer = Buffer.from(JSON.stringify(payload))
        const triggerRunId = apId()
        const platformId = await projectService.getPlatformId(projectId)
        const file = await fileService(log).save({
            projectId,
            type: FileType.TRIGGER_PAYLOAD,
            fileName: 'payload',
            compression: FileCompression.NONE,
            data: buffer,
            size: buffer.length,
            metadata: {
                triggerSourceId,
            },
        })
        const request: Omit<TriggerRun, 'created' | 'updated'> = {
            id: triggerRunId,
            projectId,
            status,
            triggerSourceId,
            platformId,
            payloadFileId: file.id,
            error,
        }
        return triggerRunRepo().save(request)
    },
})


type CreateParams = {
    projectId: ProjectId
    triggerSourceId: string
    status: TriggerRunStatus
    payload?: unknown
    error?: string
}