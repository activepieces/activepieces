import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { MigrateJobsRequest, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest } from '@activepieces/server-shared'
import { Agent, AgentRun, CreateTriggerRunRequestBody, ExecutioOutputFile, FlowRun, FlowVersion, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, JobData, McpWithTools, RunAgentRequestBody, TriggerRun, UpdateAgentRunRequestBody, UpdateRunProgressRequest } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import fetchRetry from 'fetch-retry'
import pLimit from 'p-limit'
import { workerMachine } from '../utils/machine'
import { ApAxiosClient } from './ap-axios'

const fetchWithRetry = fetchRetry(global.fetch)

const tracer = trace.getTracer('worker-api-service')

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

export const flowRunLogs = {
    async get(fullUrl: string): Promise<ExecutioOutputFile | null> {
        const response = await fetchWithRetry(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            retries: 3,
            retryDelay: 3000,
            retryOn: (status: number) => Math.floor(status / 100) === 5,
        })
        if (response.status === 404) {
            return null
        }
        try {
            return await response.json() as unknown as ExecutioOutputFile
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                return null
            }
            throw e
        }
    },
}

export const workerApiService = (workerToken: string) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())

    const client = new ApAxiosClient(apiUrl, workerToken)

    return {
        async savePayloadsAsSampleData(request: SavePayloadRequest): Promise<void> {
            await client.post('/v1/workers/save-payloads', request)
        },
        async migrateJob(request: MigrateJobsRequest): Promise<JobData> {
            return client.post<JobData>('/v1/workers/migrate-job', request)
        },
        async startRuns(request: SubmitPayloadsRequest): Promise<FlowRun[]> {
            return tracer.startActiveSpan('worker.api.startRuns', {
                attributes: {
                    'worker.flowVersionId': request.flowVersionId,
                    'worker.projectId': request.projectId,
                    'worker.environment': request.environment,
                    'worker.payloadsCount': request.payloads.length,
                    'worker.httpRequestId': request.httpRequestId ?? 'none',
                },
            }, async (span) => {
                try {
                    const arrayOfPayloads = splitPayloadsIntoOneMegabyteBatches(request.payloads)
                    span.setAttribute('worker.batchesCount', arrayOfPayloads.length)

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
                        span.setAttribute('worker.error', true)
                        span.setAttribute('worker.errorMessage', errorMessages)
                        throw new Error(`Failed to start runs: ${errorMessages}`)
                    }

                    const flowRuns = results
                        .filter((r): r is PromiseFulfilledResult<FlowRun[]> => r.status === 'fulfilled')
                        .map(r => r.value)
                        .flat()

                    span.setAttribute('worker.runsCreated', flowRuns.length)
                    return flowRuns
                }
                finally {
                    span.end()
                }
            })
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
        async getFlowVersion(request: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null> {
            return client.get<FlowVersion | null>('/v1/engine/flows', {
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