import { CreateStepRunRequestBody, ExecutioOutputFile, GetSampleDataRequest, isNil, PrincipalType, ProjectId, SERVICE_KEY_SECURITY_OPENAPI, StepOutputStatus, StepRunResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../file/file.service'
import { serverEventBus, websocketService } from '../../websockets/websockets.service'
import { flowService } from '../flow/flow.service'
import { flowRunService } from '../flow-run/flow-run-service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {
    websocketService.addListener(WebsocketServerEvent.TEST_STEP_RUN, (socket) => {
        return async (data: CreateStepRunRequestBody) => {
            const principal = await websocketService.verifyPrincipal(socket)
            fastify.log.debug({ data }, '[Socket#testStepRun]')
            
            const flowRun = data.externalFlowId ? await callAnotherFlow({
                externalFlowId: data.externalFlowId,
                projectId: principal.projectId,
                input: data.input,
                returnResponseActionPattern: data.returnResponseActionPattern,
                log: fastify.log,
            }) : await flowRunService(fastify.log).test({
                projectId: principal.projectId,
                flowVersionId: data.flowVersionId,
                payload: undefined,
                returnResponseActionPattern: data.returnResponseActionPattern,
            })

            const onProgress = async (evt: { runId: string }) => {
                if (evt.runId !== flowRun.id) {
                    return
                }

                try {
                    const flowRun = await flowRunService(fastify.log).getOneOrThrow({
                        id: evt.runId,
                        projectId: principal.projectId,
                    })
                    if (isNil(flowRun.logsFileId)) 
                        return 

                    const { data: fileData } = await fileService(fastify.log)
                        .getDataOrThrow({
                            fileId: flowRun.logsFileId,
                            projectId: flowRun.projectId,
                        })

                    const exec: ExecutioOutputFile = JSON.parse(fileData.toString('utf8'))

                    const returnStepOutput = exec.executionState.steps[data.stepName]
                    if (isNil(returnStepOutput) || returnStepOutput.status === StepOutputStatus.RUNNING) {
                        return
                    }
                    if (returnStepOutput.status !== StepOutputStatus.SUCCEEDED) {
                        throw new Error('Return step failed')
                    }
                    const response: StepRunResponse = {
                        id: data.id,
                        success: true,
                        input: exec.executionState.steps,
                        output: returnStepOutput.output ?? {},
                        standardError: '',
                        standardOutput: '',
                    }

                    socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
                    serverEventBus.off(
                        WebsocketServerEvent.TEST_STEP_RUN_PROGRESS,
                        onProgress,
                    )
                }
                catch (err) {
                    fastify.log.error(err, '[handleFlowRunProgress]')
                }
            }

            serverEventBus.on(WebsocketServerEvent.TEST_STEP_RUN_PROGRESS, onProgress)

            socket.on('disconnect', () =>
                serverEventBus.off(WebsocketServerEvent.TEST_STEP_RUN_PROGRESS, onProgress),
            )
        }
    })

    fastify.get('/', GetSampleDataRequestParams, async (request) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
            versionId: request.query.flowVersionId,
        })
        const sampleData = await sampleDataService(request.log).getOrReturnEmpty({
            projectId: request.principal.projectId,
            flowVersion: flow.version,
            stepName: request.query.stepName,
            type: request.query.type,
        })
        return sampleData
    })
}

async function callAnotherFlow(params: CallAnotherFlowParams) {
    const { externalFlowId, projectId, input, returnResponseActionPattern, log } = params
    const flow = await flowService(log).list({
        externalIds: [externalFlowId],
        projectId,
        cursorRequest: null,
        limit: 1,
        folderId: undefined,
        status: undefined,
        name: undefined,
    })
    if (flow.data.length === 0) {
        throw new Error('Subflow is not found')
    }
    const flowRun = await flowRunService(log).test({
        projectId,
        flowVersionId: flow.data[0].version.id,
        payload: input,
        returnResponseActionPattern,
    })
    return flowRun
}
type CallAnotherFlowParams = {
    externalFlowId: string
    projectId: ProjectId
    input: unknown
    returnResponseActionPattern: string | undefined
    log: FastifyBaseLogger
}

const GetSampleDataRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        tags: ['sample-data'],
        querystring: GetSampleDataRequest,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
