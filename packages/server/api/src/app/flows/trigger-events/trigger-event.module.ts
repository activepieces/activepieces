import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { flowService } from '../flow/flow.service'
import { triggerEventService } from './trigger-event.service'
import { system, SystemProp } from '@activepieces/server-shared'
import {
    ListTriggerEventsRequest,
    TestPollingTriggerRequest,
} from '@activepieces/shared'

const DEFAULT_PAGE_SIZE = 10

export const triggerEventModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(triggerEventController, { prefix: '/v1/trigger-events' })
    await systemJobsSchedule.upsertJob({
        job: {
            name: 'trigger-data-cleaner',
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: `0 * */${system.getNumber(SystemProp.EXECUTION_DATA_RETENTION_DAYS)} * *`,
        },
        async handler() {
            await triggerEventService.deleteEventsOlderThanFourteenDay()
        },
    })
}

const triggerEventController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/poll',
        {
            schema: {
                querystring: TestPollingTriggerRequest,
            },
        },
        async (request) => {
            const flow = await flowService.getOnePopulatedOrThrow({
                projectId: request.principal.projectId,
                id: request.query.flowId,
            })

            return triggerEventService.test({
                projectId: request.principal.projectId,
                flow,
            })
        },
    )

    fastify.post(
        '/',
        {
            schema: {
                querystring: TestPollingTriggerRequest,
            },
        },
        async (request) => {
            return triggerEventService.saveEvent({
                projectId: request.principal.projectId,
                flowId: request.query.flowId,
                payload: request.body,
            })
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListTriggerEventsRequest,
            },
        },
        async (request) => {
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
