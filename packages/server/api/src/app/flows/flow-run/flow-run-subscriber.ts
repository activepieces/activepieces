import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { FlowRunEntity, FlowRunSchema } from './flow-run-entity'
import { RequestPayloadProcol, requestProcol } from '../../helper/request-procol'
import { FileEntity } from '../../file/file.entity'
import { isNil, File } from '@activepieces/shared'
import { logger, fileCompressor } from 'server-shared'

@EventSubscriber()
export class FlowRunSubscriber implements EntitySubscriberInterface<FlowRunSchema> {
    listenTo(): any {
        return FlowRunEntity.options.schema
    }

    async afterUpdate(event: UpdateEvent<FlowRunSchema>): Promise<any> {
        const fileId = event.entity?.logsFileId
        console.log("\n\n\n\n\n\n\n", "event.entity", event.entity, "\n\n\n\n\n")
        logger.info("\n\n\n\n\n\n\n", "event.entity", event.entity, "\n\n\n\n\n")
        if (fileId) {
            const fileRepo = databaseConnection.getRepository<File>(FileEntity)
            const file = await fileRepo.findOneBy({ id: fileId })
            if (isNil(file)) {
                return null
            }
            const fileData = await fileCompressor.decompress({
                data: file.data,
                compression: file.compression,
            })

            const buffer = Buffer.from(fileData)
            const runData = JSON.parse(buffer.toString('utf-8'))

            const payload: RequestPayloadProcol = {
                method: 'POST',
                body: {
                    runData,
                    fileId,
                    status: event.entity?.status,
                },
                endpoint: 'workflow_runs/sync_procol',
            }
            await requestProcol(payload)
        }
    }
}