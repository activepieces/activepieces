import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { GetRunForWorkerRequest, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest } from '@activepieces/server-shared'
import { Agent, AgentRun, CreateTriggerRunRequestBody, FlowRun, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, McpWithTools, PopulatedFlow, RunAgentRequestBody, TriggerRun, UpdateAgentRunRequestBody, UpdateRunProgressRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { workerMachine } from '../utils/machine'
import { ApAxiosClient } from './ap-axios'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

export const workerApiService = (workerToken: string) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())

    const client = new ApAxiosClient(apiUrl, workerToken)

    return {
        async savePayloadsAsSampleData(request: SavePayloadRequest): Promise<void> {
            await client.post('/v1/workers/save-payloads', request)
        },
        async startRuns(request: SubmitPayloadsRequest): Promise<FlowRun[]> {
            const arrayOfPayloads = splitPayloadsIntoOneMegabyteBatches(request.payloads)
            const limit = pLimit(1)
            const promises = arrayOfPayloads.map(payloads =>
                limit(() => client.post<FlowRun[]>('/v1/workers/submit-payloads', {
                    ...request,
                    payloads,
                    parentRunId: request.parentRunId,
                    failParentOnFailure: request.failParentOnFailure,
                })),
            )

            const results = await Promise.allSettled(promises)
            const errors = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.reason.message).join(', ')
                throw new Error(`Failed to start runs: ${errorMessages}`)
            }

            return results
                .filter((r): r is PromiseFulfilledResult<FlowRun[]> => r.status === 'fulfilled')
                .map(r => r.value)
                .flat()
        },
        async sendUpdate(request: SendEngineUpdateRequest): Promise<void> {
            await client.post('/v1/workers/send-engine-update', request)
        },
    }
}

function splitPayloadsIntoOneMegabyteBatches(payloads: unknown[]): unknown[][] {
    const batches: unknown[][] = [[]]
    const ONE_MB = 1024 * 1024
    let currentSize = 0
    for (const payload of payloads) {
        const payloadSize = Buffer.byteLength(JSON.stringify(payload))
        currentSize += payloadSize

        if (currentSize > ONE_MB) {
            batches.push([])
            currentSize = payloadSize
        }

        batches[batches.length - 1].push(payload)
    }

    return batches
}



export const engineApiService = (engineToken: string) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())
    const client = new ApAxiosClient(apiUrl, engineToken)

    return {
        async getFile(fileId: string): Promise<Buffer> {
            return client.get<Buffer>(`/v1/engine/files/${fileId}`, {
                responseType: 'arraybuffer',
            })
        },
        async getRun(request: GetRunForWorkerRequest): Promise<FlowRun> {
            return client.get<FlowRun>('/v1/engine/runs/' + request.runId, {})
        },
        async createTriggerRun(request: CreateTriggerRunRequestBody): Promise<TriggerRun> {
            return client.post<TriggerRun>('/v1/engine/create-trigger-run', request)
        },
        async updateRunStatus(request: UpdateRunProgressRequest): Promise<void> {
            await client.post('/v1/engine/update-run', request)
        },
        async getPiece(name: string, options: GetPieceRequestQuery): Promise<PieceMetadataModel> {
            return client.get<PieceMetadataModel>(`/v1/pieces/${encodeURIComponent(name)}`, {
                params: options,
            })
        },
        async getFlow(request: GetFlowVersionForWorkerRequest): Promise<PopulatedFlow | null> {
            return client.get<PopulatedFlow | null>('/v1/engine/flows', {
                params: request,
            })
        },
    }
}

export const agentsApiService = (workerToken: string, _log: FastifyBaseLogger) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())
    const client = new ApAxiosClient(apiUrl, workerToken)

    return {
        async getAgent(agentId: string): Promise<Agent> {
            return client.get<Agent>(`/v1/agents/${agentId}`, {})
        },

        async getMcp(mcpId: string): Promise<McpWithTools> {
            return client.get<McpWithTools>(`/v1/mcp-servers/${mcpId}`, {})
        },

        async createAgentRun(agentRun: RunAgentRequestBody): Promise<AgentRun> {
            return client.post<AgentRun>('/v1/agent-runs', agentRun)
        },
        async updateAgentRun(agentRunId: string, agentRun: UpdateAgentRunRequestBody): Promise<AgentRun> {
            return client.post<AgentRun>(`/v1/agent-runs/${agentRunId}/update`, agentRun)
        },
    }
}