import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { agentToolSkills } from '@activepieces/shared'
import { McpTools } from './tool-set'

function fromToolCalls({ toolCalls }: { toolCalls: CreatingToolCall[] }): CreatedResources {
    const found = toolCalls.flatMap((call) => call.errored ? [] : createdBy(call))
    const idsOf = (kind: ResourceKind): string[] => [...new Set(found.filter((resource) => resource.kind === kind).map((resource) => resource.id))]
    return { flowIds: idsOf('flow'), tableIds: idsOf('table'), folderIds: idsOf('folder') }
}

async function remove({ mcp, created }: { mcp: McpTools, created: CreatedResources }): Promise<string[]> {
    const flowProblems = await Promise.all(created.flowIds.map((flowId) => deleteOne({ mcp, toolName: DELETE_FLOW_TOOL, input: { flowId }, label: `flow ${flowId}` })))
    const tableProblems = await Promise.all(created.tableIds.map((tableId) => deleteOne({ mcp, toolName: DELETE_TABLE_TOOL, input: { tableId }, label: `table ${tableId}` })))
    const folderProblems = created.folderIds.length === 0 ? [] : [`kept folder(s) ${created.folderIds.join(', ')}: the dev server has no folder delete tool`]
    return [...flowProblems.flat(), ...tableProblems.flat(), ...folderProblems]
}

async function crowdedWarning({ mcp }: { mcp: McpTools }): Promise<string | null> {
    const execute = mcp.toolSet[LIST_FLOWS_TOOL]?.execute
    if (isNil(execute)) {
        return null
    }
    const { data } = await tryCatch(async () => execute({ limit: CROWDED_FLOWS + 1 }, { toolCallId: LIST_FLOWS_TOOL, messages: [], context: {} }))
    const structured = isObject(data) && isObject(data['structuredContent']) ? data['structuredContent'] : {}
    const count = typeof structured['count'] === 'number' ? structured['count'] : 0
    return count > CROWDED_FLOWS ? `The eval project "${mcp.projectName}" already holds more than ${CROWDED_FLOWS} flows: delete the leftovers on the dev server, they make live cases fail.` : null
}

async function deleteOne({ mcp, toolName, input, label }: { mcp: McpTools, toolName: string, input: Record<string, string>, label: string }): Promise<string[]> {
    const execute = mcp.toolSet[toolName]?.execute
    if (isNil(execute)) {
        return [`could not delete ${label}: the dev server MCP does not offer ${toolName}`]
    }
    const { data, error } = await tryCatch(async () => execute(input, { toolCallId: toolName, messages: [], context: {} }))
    if (!isNil(error)) {
        return [`could not delete ${label}: ${error.message}`]
    }
    return isObject(data) && data['isError'] === true ? [`could not delete ${label}: ${outputText(data) ?? 'the tool returned an error'}`] : []
}

function createdBy(call: CreatingToolCall): CreatedResource[] {
    const { toolName } = agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input })
    const rule = CREATE_RULES[toolName]
    if (isNil(rule) || (isObject(call.output) && call.output['isError'] === true)) {
        return []
    }
    const structured = isObject(call.output) && isObject(call.output['structuredContent']) ? call.output['structuredContent'] : {}
    const fromStructured = isNil(rule.structuredKey) ? undefined : structured[rule.structuredKey]
    const id = typeof fromStructured === 'string' ? fromStructured : outputText(call.output)?.match(rule.textPattern)?.[1]
    return isNil(id) ? [] : [{ kind: rule.kind, id }]
}

function outputText(output: unknown): string | null {
    if (typeof output === 'string') {
        return output
    }
    const content = isObject(output) ? output['content'] : null
    if (!Array.isArray(content)) {
        return null
    }
    const texts = content.flatMap((item) => isObject(item) && typeof item['text'] === 'string' ? [item['text']] : [])
    return texts.length === 0 ? null : texts.join('\n')
}

const DELETE_FLOW_TOOL = 'ap_delete_flow'
const DELETE_TABLE_TOOL = 'ap_delete_table'
const LIST_FLOWS_TOOL = 'ap_list_flows'
const CROWDED_FLOWS = 20

const CREATE_RULES: Record<string, CreateRule | undefined> = {
    ap_create_flow: { kind: 'flow', structuredKey: 'flowId', textPattern: /Created flow ".*?" \(id: ([A-Za-z0-9_-]+)\)/ },
    ap_build_flow: { kind: 'flow', structuredKey: 'flowId', textPattern: /Flow ".*?" created \(id: ([A-Za-z0-9_-]+)\)/ },
    ap_duplicate_flow: { kind: 'flow', structuredKey: null, textPattern: /Copy: ".*?" \(id: ([A-Za-z0-9_-]+)\)/ },
    ap_create_table: { kind: 'table', structuredKey: 'id', textPattern: /Table ".*?" created \(id: ([A-Za-z0-9_-]+)/ },
    ap_create_folder: { kind: 'folder', structuredKey: 'folderId', textPattern: /Folder ".*?" is ready \(id: ([A-Za-z0-9_-]+)\)/ },
}

export const createdResources = {
    fromToolCalls,
    remove,
    crowdedWarning,
}

type ResourceKind = 'flow' | 'table' | 'folder'

type CreateRule = { kind: ResourceKind, structuredKey: string | null, textPattern: RegExp }

type CreatedResource = { kind: ResourceKind, id: string }

export type CreatingToolCall = {
    toolName: string
    input: unknown
    output: unknown
    errored: boolean
}

export type CreatedResources = {
    flowIds: string[]
    tableIds: string[]
    folderIds: string[]
}
