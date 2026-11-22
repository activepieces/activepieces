import { isNil, Result, tryCatch } from '@activepieces/core-utils'
import { z } from 'zod'
import { devServer } from './dev-server'
import { evalToolSet, McpCredentials, McpTools } from './tool-set'

async function run<T>({ keep, use }: { keep: boolean, use: (mcp: McpTools) => Promise<T> }): Promise<WorkspaceRun<T>> {
    const created = await tryCatch(() => create())
    if (!isNil(created.error)) {
        return { result: { data: null, error: new Error(`could not create an eval workspace: ${created.error.message}`) }, notes: [] }
    }
    const workspace = created.data
    const result = await tryCatch(() => useConnected({ workspace, use }))
    const notes = keep ? [`kept eval workspace "${workspace.projectName}" (${workspace.projectId})`] : await remove({ workspace })
    return { result, notes }
}

async function create(): Promise<Workspace> {
    const res = await devServer.request({ path: WORKSPACE_PATH, method: 'POST', body: {} })
    if (!res.ok) {
        throw new Error(`the dev server at ${devServer.url()} answered ${res.status}: ${await res.text()}`)
    }
    return Workspace.parse(await res.json())
}

async function useConnected<T>({ workspace, use }: { workspace: Workspace, use: (mcp: McpTools) => Promise<T> }): Promise<T> {
    const mcp = await evalToolSet.connect(workspace)
    return use(mcp).finally(() => mcp.close().catch(() => undefined))
}

async function remove({ workspace }: { workspace: Workspace }): Promise<string[]> {
    const label = `eval workspace "${workspace.projectName}" (${workspace.projectId})`
    const { data: res, error } = await tryCatch(() => devServer.request({ path: `${WORKSPACE_PATH}/${encodeURIComponent(workspace.projectId)}`, method: 'DELETE' }))
    if (!isNil(error)) {
        return [`could not delete ${label}: ${error.message}`]
    }
    return res.ok ? [] : [`could not delete ${label}: ${res.status} ${await res.text()}`]
}

const WORKSPACE_PATH = '/v1/agents/eval/workspace'
const Workspace = McpCredentials.extend({ baseProjectId: z.string() })

export const evalWorkspace = {
    run,
}

type Workspace = z.infer<typeof Workspace>

export type WorkspaceRun<T> = {
    result: Result<T>
    notes: string[]
}
