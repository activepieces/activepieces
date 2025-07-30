import { PrincipalType, RunEnvironment, EngineHttpResponse, apId, PauseType, ExecutionType, ProgressUpdateType, ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { flowRunService } from '../flow-run/flow-run-service'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { StatusCodes } from 'http-status-codes'

export const testFlowVersionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', TestFlowVersionRequest, async (req) => {
        const { id } = req.params
        const { parentFlowId, parentFlowVersionId, parentFlowDisplayName, returnResponseAction, payload } = req.body
        const testCallbackRequestId = apId()
        const synchronousHandlerId = engineResponseWatcher(req.log).getServerId()
        const directCallbackUrl = await domainHelper.getPublicApiUrl({ 
            path: `/v1/test-flow-version/${id}/requests/${testCallbackRequestId}`, 
            platformId: req.principal.platform.id 
        })
        
        const parentFlowRun = await flowRunService(req.log).getOrCreate({
            projectId: req.principal.projectId,
            flowId: parentFlowId,
            flowVersionId: parentFlowVersionId,
            flowDisplayName: parentFlowDisplayName,
            environment: RunEnvironment.TESTING,
            parentRunId: undefined,
            failParentOnFailure: false,
        })
        
        await flowRunService(req.log).start({
            projectId: req.principal.projectId,
            flowVersionId: id,
            parentRunId: parentFlowRun.id,
            payload: {
                data: payload,
                callbackUrl: directCallbackUrl,
            },
            environment: RunEnvironment.TESTING,
            executeTrigger: false,
            executionType: ExecutionType.BEGIN,
            synchronousHandlerId,
            httpRequestId: testCallbackRequestId,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            failParentOnFailure: true,
            returnResponseAction,
        })

        return engineResponseWatcher(req.log).oneTimeListener<EngineHttpResponse>(testCallbackRequestId, true, 30000, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    })

    app.post('/:id/requests/:requestId', TestFlowVersionCallbackRequest, async (req) => {
        const { requestId } = req.params
        
        await engineResponseWatcher(req.log).publish(requestId, engineResponseWatcher(req.log).getServerId(), req.body)
        
        return {}
    })
}

const TestFlowVersionRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: Type.Object({
            parentFlowId: Type.String(),
            parentFlowVersionId: Type.String(),
            parentFlowDisplayName: Type.String(),
            returnResponseAction: Type.String(),
            payload: Type.Unknown(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
}

const TestFlowVersionCallbackRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            requestId: Type.String(),
        }),
    },
}
