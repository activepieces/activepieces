import { apId, CollectionId, Instance, InstanceId, InstanceStatus, ProjectId, TelemetryEventName, UpdateInstanceRequest, UpsertInstanceRequest } from '@activepieces/shared'
import { collectionService } from '../collections/collection.service'
import { databaseConnection } from '../database/database-connection'
import { flowService } from '../flows/flow.service'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { InstanceEntity } from './instance.entity'
import { instanceSideEffects } from './instance-side-effects'
import { telemetry } from '../helper/telemetry.utils'

export const instanceRepo = databaseConnection.getRepository(InstanceEntity)

export const instanceService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertInstanceRequest }): Promise<Instance> {
        const collection = await collectionService.getOne({ projectId: projectId, id: request.collectionId })
        if (collection == null) {
            throw new ActivepiecesError({
                code: ErrorCode.COLLECTION_NOT_FOUND,
                params: {
                    id: request.collectionId,
                },
            })
        }

        const flowPage = await flowService.list({
            projectId: projectId,
            collectionId: request.collectionId,
            cursorRequest: null,
            limit: Number.MAX_SAFE_INTEGER,
        })

        const flowIdToVersionId = Object.fromEntries(flowPage.data.map((flow) => [flow.id, flow.version.id]))

        const oldInstance: Partial<Instance | null> = await instanceRepo.findOneBy({ projectId, collectionId: request.collectionId })

        if (oldInstance) {
            await instanceRepo.delete(oldInstance.id)
        }

        const newInstance: Partial<Instance> = {
            id: apId(),
            projectId: collection.projectId,
            collectionId: request.collectionId,
            flowIdToVersionId,
            status: request.status,
        }

        const savedInstance = await instanceRepo.save(newInstance)

        if (oldInstance) {
            await instanceSideEffects.disable(oldInstance)
        }
        telemetry.trackProject(
            savedInstance.projectId,
            {
                name: TelemetryEventName.COLLECTION_ENABLED,
                payload: {
                    collectionId: savedInstance.collectionId,
                    projectId: savedInstance.projectId,
                },
            })
        await instanceSideEffects.enable(savedInstance)
        return savedInstance
    },

    async getByCollectionId({ projectId, collectionId }: GetOneParams): Promise<Instance | null> {
        return await instanceRepo.findOneBy({
            projectId,
            collectionId,
        })
    },

    async deleteOne({ id, projectId }: DeleteOneParams): Promise<void> {
        const instance = await instanceRepo.findOneBy({
            projectId,
            id,
        })
        if (instance) {
            await instanceSideEffects.disable(instance)
        }
        await instanceRepo.delete({
            id,
            projectId,
        })
    },
    async updateInstanceStatusByCollectionId({ projectId, request, collectionId }: { projectId: ProjectId, collectionId: CollectionId, request: UpdateInstanceRequest }) {
        const instance: Instance | null = await instanceService.getByCollectionId({ projectId, collectionId: collectionId })
        if (instance === null) {
            throw new ActivepiecesError({
                code: ErrorCode.INSTANCE_NOT_FOUND,
                params: {
                    id: collectionId,
                },
            })
        }
        if (instance) {
            const oldInstanceStatus = instance.status
            instance.status = request.status
            if (oldInstanceStatus !== instance.status) {
                if (instance.status === InstanceStatus.ENABLED) {
                    await instanceSideEffects.enable(instance)
                }
                else {
                    await instanceSideEffects.disable(instance)
                }
            }
            instanceRepo.save(instance)
            return instance
        }
    },
}

type GetOneParams = {
    projectId: ProjectId
    collectionId: CollectionId
}

type DeleteOneParams = {
    id: InstanceId
    projectId: ProjectId
}
