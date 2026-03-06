import { PieceMetadataModel } from '@activepieces/pieces-framework'
import {
    FlowVersion,
    GetFlowVersionForWorkerRequest,
    GetPieceRequestQuery,
    WorkerSettingsResponse,
} from '@activepieces/shared'

type PollJobResponse = {
    jobId: string
    data: unknown
} | null

export const apiClient = {
    async poll(apiUrl: string, workerToken: string, timeoutMs: number): Promise<PollJobResponse> {
        const response = await fetch(`${apiUrl}/v1/worker-jobs/poll?timeoutMs=${timeoutMs}`, {
            headers: { Authorization: `Bearer ${workerToken}` },
            signal: AbortSignal.timeout(timeoutMs + 5000),
        })
        if (!response.ok) {
            throw new Error(`Poll failed with status ${response.status}`)
        }
        return response.json() as Promise<PollJobResponse>
    },

    async reportJobCompleted(apiUrl: string, workerToken: string, jobId: string, result: unknown): Promise<void> {
        const response = await fetch(`${apiUrl}/v1/worker-jobs/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${workerToken}`,
            },
            body: JSON.stringify({ jobId, result }),
        })
        if (!response.ok) {
            throw new Error(`Report completed failed with status ${response.status}`)
        }
    },

    async reportJobFailed(apiUrl: string, workerToken: string, jobId: string, errorMessage: string): Promise<void> {
        const response = await fetch(`${apiUrl}/v1/worker-jobs/fail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${workerToken}`,
            },
            body: JSON.stringify({ jobId, errorMessage }),
        })
        if (!response.ok) {
            throw new Error(`Report failed with status ${response.status}`)
        }
    },

    async getWorkerSettings(apiUrl: string, workerToken: string): Promise<WorkerSettingsResponse> {
        const response = await fetch(`${apiUrl}/v1/workers/settings`, {
            headers: { Authorization: `Bearer ${workerToken}` },
        })
        if (!response.ok) {
            throw new Error(`Get worker settings failed with status ${response.status}`)
        }
        return response.json() as Promise<WorkerSettingsResponse>
    },

    async getPiece(apiUrl: string, workerToken: string, name: string, query: GetPieceRequestQuery): Promise<PieceMetadataModel> {
        const params = new URLSearchParams()
        if (query.version) params.set('version', query.version)
        if (query.projectId) params.set('projectId', query.projectId)
        if (query.locale) params.set('locale', query.locale)
        const qs = params.toString()
        const url = `${apiUrl}/v1/pieces/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${workerToken}` },
        })
        if (!response.ok) {
            throw new Error(`Get piece failed with status ${response.status}`)
        }
        return response.json() as Promise<PieceMetadataModel>
    },

    async getFlowVersion(apiUrl: string, workerToken: string, request: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null> {
        const params = new URLSearchParams({ versionId: request.versionId })
        const response = await fetch(`${apiUrl}/v1/engine/flows?${params.toString()}`, {
            headers: { Authorization: `Bearer ${workerToken}` },
        })
        if (response.status === 404) {
            return null
        }
        if (!response.ok) {
            throw new Error(`Get flow version failed with status ${response.status}`)
        }
        return response.json() as Promise<FlowVersion | null>
    },

    async getPieceArchive(apiUrl: string, workerToken: string, archiveId: string): Promise<Buffer> {
        const response = await fetch(`${apiUrl}/v1/workers/archive/${archiveId}`, {
            headers: { Authorization: `Bearer ${workerToken}` },
        })
        if (!response.ok) {
            throw new Error(`Get piece archive failed with status ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
    },
}
