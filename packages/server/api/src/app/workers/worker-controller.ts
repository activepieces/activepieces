import { MigrateJobsRequest, rejectedPromiseHandler, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest } from '@activepieces/server-shared'
import { ExecutionType, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { trace } from '@opentelemetry/api'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { dedupeService } from '../trigger/dedupe-service'
import { triggerEventService } from '../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobMigrations } from './queue/jobs-migrations'

const tracer = trace.getTracer('worker-controller')

export const flowWorkerController: FastifyPluginAsyncTypebox = async (app) => {


    app.post('/send-engine-update', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SendEngineUpdateRequest,
        },
    }, async (request) => {
        return tracer.startActiveSpan('worker.sendEngineUpdate', {
            attributes: {
                'worker.requestId': request.body.requestId,
                'worker.workerServerId': request.body.workerServerId,
            },
        }, async (span) => {
            try {
                const { workerServerId, requestId, response } = request.body
                await engineResponseWatcher(request.log).publish(requestId, workerServerId, response)
                span.setAttribute('worker.published', true)
                return {}
            }
            finally {
                span.end()
            }
        })
    })
    app.post('/save-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SavePayloadRequest,
        },

    }, async (request) => {
        const { flowId, projectId, payloads } = request.body
        const savePayloads = payloads.map((payload) =>
            rejectedPromiseHandler(triggerEventService(request.log).saveEvent({
                flowId,
                payload,
                projectId,
            }), request.log),
        )
        rejectedPromiseHandler(Promise.all(savePayloads), request.log)
        const hasValidPayloads = payloads.length > 0
        if (hasValidPayloads) {
            await triggerSourceService(request.log).disable({
                flowId,
                projectId,
                simulate: true,
                ignoreError: true,
            })
        }
        return {}
    })

    app.post('/migrate-job', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: MigrateJobsRequest,
        },
    }, async (request) => {
        return jobMigrations.apply(request.body.jobData)
    })
    
    app.post('/submit-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SubmitPayloadsRequest,
        },
    }, async (request) => {
        return tracer.startActiveSpan('worker.submitPayloads', {
            attributes: {
                'worker.flowVersionId': request.body.flowVersionId,
                'worker.projectId': request.body.projectId,
                'worker.payloadsCount': request.body.payloads.length,
                'worker.environment': request.body.environment,
                'worker.httpRequestId': request.body.httpRequestId ?? 'none',
            },
        }, async (span) => {
            try {
                const { flowVersionId, projectId, payloads, httpRequestId, synchronousHandlerId, progressUpdateType, environment, parentRunId, failParentOnFailure, platformId } = request.body

                const flowVersionExists = await flowVersionService(request.log).getOne(flowVersionId)
                if (!flowVersionExists) {
                    span.setAttribute('worker.flowVersionExists', false)
                    return []
                }

                span.setAttribute('worker.flowVersionExists', true)
                const filterPayloads = await dedupeService.filterUniquePayloads(
                    flowVersionId,
                    payloads,
                )

                span.setAttribute('worker.filteredPayloadsCount', filterPayloads.length)
                const createFlowRuns = filterPayloads.map((payload) => {
                    return flowRunService(request.log).start({
                        flowId: flowVersionExists.flowId,
                        environment,
                        flowVersionId,
                        payload,
                        synchronousHandlerId,
                        projectId,
                        httpRequestId,
                        executionType: ExecutionType.BEGIN,
                        progressUpdateType,
                        executeTrigger: false,
                        parentRunId,
                        failParentOnFailure,
                        platformId,
                    })
                })
                const flowRuns = await Promise.all(createFlowRuns)
                span.setAttribute('worker.flowRunsCreated', flowRuns.length)
                return flowRuns
            }
            finally {
                span.end()
            }
        })
    })


}

