import { ActivepiecesError, ErrorCode, StepFile, StepFileGet, StepFileUpsert, apId, isNil } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { StepFileEntity } from './step-file.entity'

const stepFileRepo = databaseConnection.getRepository<StepFile>(StepFileEntity)

export const stepFileService = {
    async upsert({ request, projectId }: { request: StepFileUpsert, projectId: string }): Promise<StepFile | null> {
        const fileId = apId()
        const bufferFile = request.file as Buffer
        await stepFileRepo.upsert({
            id: fileId,
            flowId: request.flowId,
            projectId,
            stepName: request.stepName,
            size: bufferFile.byteLength,
            data: bufferFile,
            name: request.name,
        }, ['flowId', 'projectId', 'stepName', 'name'])
        return stepFileRepo.findOneByOrFail({
            id: fileId,
            projectId,
        })
    },
    async get({ projectId, id }: StepFileGet): Promise<StepFile | null> {
        const file = stepFileRepo.findOneBy({
            id,
            projectId,
        })
        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Step file with id ${id} not found`,
                },
            })
        }
        return file
    },
    async delete({ projectId, id }: StepFileGet): Promise<void> {
        const file = stepFileRepo.findOneBy({
            id,
            projectId,
        })
        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Step file with id ${id} not found`,
                },
            })
        }
        await stepFileRepo.delete({
            id,
            projectId,
        })
    },
    async deleteAll({ projectId, flowId, stepName }: { projectId: string, flowId: string, stepName: string }): Promise<void> {
        await stepFileRepo.delete({
            projectId,
            flowId,
            stepName,
        })
    },
}
