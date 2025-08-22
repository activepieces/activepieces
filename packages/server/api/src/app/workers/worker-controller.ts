import { rejectedPromiseHandler, ResumeRunRequest, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest } from '@activepieces/server-shared'
import { ExecutionType, PrincipalType, ProgressUpdateType, RunEnvironment } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { dedupeService } from '../flows/trigger/dedupe'
import { triggerEventService } from '../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from './engine-response-watcher'

export const flowWorkerController: FastifyPluginAsyncTypebox = async (app) => {


    app.post('/send-engine-update', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SendEngineUpdateRequest,
        },
    }, async (request) => {
        const { workerServerId, requestId, response } = request.body
        await engineResponseWatcher(request.log).publish(requestId, workerServerId, response)
        return {}
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
        await triggerSourceService(request.log).disable({
            flowId,
            projectId,
            simulate: true,
            ignoreError: true,
        })
        return {}
    })

    app.post('/submit-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SubmitPayloadsRequest,
        },
    }, async (request) => {
        const { flowVersionId, projectId, payloads, httpRequestId, synchronousHandlerId, progressUpdateType, environment, parentRunId, failParentOnFailure } = request.body

        const flowVersionExists = await flowVersionService(request.log).exists(flowVersionId)
        if (!flowVersionExists) {
            return []
        }
        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersionId,
            payloads,
        )
        const createFlowRuns = filterPayloads.map((payload) =>{
            return  flowRunService(request.log).start({
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
            })
        })
        return Promise.all(createFlowRuns)
    })

    app.post('/resume-run', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: ResumeRunRequest,
        },
    }, async (request) => {
        const data = request.body
        const flowRun = await flowRunService(request.log).getOneOrThrow({
            id: data.runId,
            projectId: data.projectId,
        })
        await flowRunService(request.log).start({
            payload: null,
            existingFlowRunId: data.runId,
            executeTrigger: false,
            synchronousHandlerId: data.synchronousHandlerId ?? undefined,
            projectId: data.projectId,
            flowVersionId: data.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: data.httpRequestId,
            environment: RunEnvironment.PRODUCTION,
            progressUpdateType: data.progressUpdateType ?? ProgressUpdateType.NONE,
            parentRunId: flowRun.parentRunId,
            failParentOnFailure: flowRun.failParentOnFailure,
        })
    })

}

