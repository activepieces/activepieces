import {
    FileType,
    ListTriggerEventsRequest,
    TestPollingTriggerRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { fileService } from '../../file/file.service'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { flowService } from '../flow/flow.service'
import { triggerEventService } from './trigger-event.service'

const DEFAULT_PAGE_SIZE = 10

export const triggerEventModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.TRIGGER_DATA_CLEANER, async () => {
        // The trigger event file will be deleted by relationship in the database.
        await fileService.deleteStaleBulk(FileType.TRIGGER_EVENT_FILE)
    })
    await app.register(triggerEventController, { prefix: '/v1/trigger-events' })
    await systemJobsSchedule.upsertJob({
        job: {
            name: SystemJobName.TRIGGER_DATA_CLEANER,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0 * */1 * *',
        },
    })
}

const triggerEventController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/poll', TestPollingTriggerRequestParams, async (request) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            projectId: request.principal.projectId,
            id: request.query.flowId,
        })

        return triggerEventService.test({
            projectId: request.principal.projectId,
            flow,
            platformId: request.principal.platform.id,
        })
    })

    fastify.post('/', PollRequestParams, async (request) => {
        return triggerEventService.saveEvent({
            projectId: request.principal.projectId,
            flowId: request.query.flowId,
            payload: request.body,
        })
    })

    fastify.get('/', ListTriggerEventsRequestParams, async (request) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
        })

        return triggerEventService.list({
            projectId: request.principal.projectId,
            flow,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
        })
    },
    )
}



const TestPollingTriggerRequestParams = {
    schema: {
        querystring: TestPollingTriggerRequest,
    },
}

const ListTriggerEventsRequestParams = {
    schema: {
        querystring: ListTriggerEventsRequest,
    },
}

const PollRequestParams = {
    schema: {
        querystring: TestPollingTriggerRequest,
    },
}