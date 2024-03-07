import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm'
import { FlowRunEntity, FlowRunSchema } from './flow-run-entity'
import { RequestPayloadProcol, requestProcol } from '../../helper/request-procol'
import { logger } from 'server-shared'

@EventSubscriber()
export class FlowRunSubscriber implements EntitySubscriberInterface<FlowRunSchema> {
    listenTo(): any {
        return FlowRunEntity.options.schema
    }

    async afterUpdate(event: UpdateEvent<FlowRunSchema>): Promise<any> {
        const steps = event.entity?.steps
        console.log("\n\n\n\n", "steps", steps, "\n\n\n\n")
        logger.info("\n\n\n\n", "steps", steps, "\n\n\n\n")
        if (steps) {
            const runData = event.entity

            const payload: RequestPayloadProcol = {
                method: 'POST',
                body: {
                    runData,
                    steps,
                },
                endpoint: 'workflow_runs/sync_procol',
            }
            await requestProcol(payload)
        }
    }
}