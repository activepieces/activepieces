import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { evalToolSet, McpTools } from './tool-set'
import { evalWorkspace } from './workspace'

vi.mock('./tool-set', async (importOriginal) => {
    const original = await importOriginal<typeof import('./tool-set')>()
    return { ...original, evalToolSet: { ...original.evalToolSet, connect: vi.fn() } }
})

describe('evalWorkspace.run', () => {
    const connect = vi.mocked(evalToolSet.connect)
    const close = vi.fn(async () => undefined)
    const requests: { method: string, url: string }[] = []

    beforeEach(() => {
        requests.length = 0
        close.mockClear()
        vi.stubEnv('AP_API_KEY', 'eval-key')
        connect.mockImplementation(async ({ projectId, projectName, conversationId }) => mcpOf({ projectId, projectName, conversationId, close }))
        stubFetch({ createStatus: 200, deleteStatus: 204 })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    function stubFetch({ createStatus, deleteStatus }: { createStatus: number, deleteStatus: number }): void {
        vi.stubGlobal('fetch', async (url: string, init: { method: string }) => {
            requests.push({ method: init.method, url })
            if (init.method === 'POST') {
                return new Response(createStatus === 200 ? JSON.stringify(WORKSPACE) : 'boom', { status: createStatus })
            }
            return new Response(deleteStatus === 204 ? null : 'gone wrong', { status: deleteStatus })
        })
    }

    it('creates a workspace, runs in its project and deletes it', async () => {
        const { result, notes } = await evalWorkspace.run({ keep: false, use: async (mcp) => mcp.projectId })

        expect(result.data).toBe('proj-ws')
        expect(notes).toEqual([])
        expect(requests).toEqual([
            { method: 'POST', url: 'http://localhost:3000/api/v1/agents/eval/workspace' },
            { method: 'DELETE', url: 'http://localhost:3000/api/v1/agents/eval/workspace/proj-ws' },
        ])
        expect(close).toHaveBeenCalledOnce()
    })

    it('still closes the client and deletes the workspace when the run throws', async () => {
        const { result } = await evalWorkspace.run({ keep: false, use: async () => {
            throw new Error('turn broke')
        } })

        expect(result.error?.message).toBe('turn broke')
        expect(close).toHaveBeenCalledOnce()
        expect(requests.map((request) => request.method)).toEqual(['POST', 'DELETE'])
    })

    it('deletes the workspace when the MCP connection fails', async () => {
        connect.mockRejectedValueOnce(new Error('no MCP'))

        const { result } = await evalWorkspace.run({ keep: false, use: async () => 'unused' })

        expect(result.error?.message).toBe('no MCP')
        expect(requests.map((request) => request.method)).toEqual(['POST', 'DELETE'])
    })

    it('keeps the workspace with --keep and names it', async () => {
        const { notes } = await evalWorkspace.run({ keep: true, use: async () => 'done' })

        expect(requests.map((request) => request.method)).toEqual(['POST'])
        expect(notes).toEqual(['kept eval workspace "eval-ab12cd34" (proj-ws)'])
    })

    it('reports a workspace it could not create, without deleting anything', async () => {
        stubFetch({ createStatus: 500, deleteStatus: 204 })

        const { result } = await evalWorkspace.run({ keep: false, use: async () => 'unused' })

        expect(result.error?.message).toContain('could not create an eval workspace')
        expect(requests.map((request) => request.method)).toEqual(['POST'])
    })

    it('reports a workspace it could not delete', async () => {
        stubFetch({ createStatus: 200, deleteStatus: 404 })

        const { notes } = await evalWorkspace.run({ keep: false, use: async () => 'done' })

        expect(notes).toEqual(['could not delete eval workspace "eval-ab12cd34" (proj-ws): 404 gone wrong'])
    })
})

function mcpOf({ projectId, projectName, conversationId, close }: { projectId: string, projectName: string, conversationId: string, close: () => Promise<undefined> }): McpTools {
    return { toolSet: {}, close, projectId, projectName, conversationId }
}

const WORKSPACE = { mcpServerUrl: 'http://localhost:3000/api/v1/mcp', mcpToken: 'token', conversationId: 'evalconv1', projectId: 'proj-ws', projectName: 'eval-ab12cd34', baseProjectId: 'proj-base' }
