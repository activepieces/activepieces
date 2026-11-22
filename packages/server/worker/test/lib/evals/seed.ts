import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { LiveSettings, SeedFlow, SeedTable } from './eval-case'
import { seedConnections } from './seed-connections'
import { evalToolSet, McpTools, ToolResult } from './tool-set'

async function create({ mcp, seed, answers }: { mcp: McpTools, seed: LiveSettings['seed'], answers: LiveSettings['answers'] }): Promise<SeededState> {
    const resolved = await seedConnections.resolve({ flows: seed.flows, answers, listConnections: (pieceName) => evalToolSet.listConnections({ mcp, pieceName }) })
    if (resolved.unmet.length > 0) {
        throw new Error(`skipped: ${resolved.unmet.join('; ')}`)
    }
    const tables = await Promise.all(seed.tables.map((table) => seedTable({ mcp, table })))
    const folders = await Promise.all(byFolder(resolved.flows).map((flows) => seedInOrder({ mcp, flows })))
    return { flows: folders.flat(), tables }
}

function byFolder(flows: SeedFlow[]): SeedFlow[][] {
    const folderOf = (flow: SeedFlow): string | null => typeof flow['folderName'] === 'string' ? flow['folderName'] : null
    const unfiled = flows.filter((flow) => isNil(folderOf(flow))).map((flow) => [flow])
    const folders = [...new Set(flows.flatMap((flow) => {
        const folder = folderOf(flow)
        return isNil(folder) ? [] : [folder]
    }))]
    return [...unfiled, ...folders.map((folder) => flows.filter((flow) => folderOf(flow) === folder))]
}

async function seedInOrder({ mcp, flows }: { mcp: McpTools, flows: SeedFlow[] }): Promise<SeededFlow[]> {
    return flows.reduce<Promise<SeededFlow[]>>(async (seeded, flow) => [...await seeded, await seedFlow({ mcp, flow })], Promise.resolve([]))
}

async function seedFlow({ mcp, flow }: { mcp: McpTools, flow: SeedFlow }): Promise<SeededFlow> {
    const result = await callTool({ mcp, toolName: BUILD_FLOW_TOOL, input: flow, label: `flow "${flow.flowName}"` })
    const flowId = result.structured['flowId']
    if (typeof flowId !== 'string') {
        throw new Error(`could not seed flow "${flow.flowName}": ${result.text}`)
    }
    return { name: flow.flowName, id: flowId }
}

async function seedTable({ mcp, table }: { mcp: McpTools, table: SeedTable }): Promise<SeededTable> {
    const { records = [], ...definition } = table
    const label = `table "${table.name}"`
    const created = await callTool({ mcp, toolName: CREATE_TABLE_TOOL, input: definition, label })
    const tableId = created.structured['id']
    if (typeof tableId !== 'string') {
        throw new Error(`could not seed ${label}: ${created.text}`)
    }
    for (const batch of chunk(records, INSERT_BATCH)) {
        await callTool({ mcp, toolName: INSERT_RECORDS_TOOL, input: { tableId, records: batch.map(asTextRecord) }, label: `records of ${label}` })
    }
    return { name: table.name, id: tableId, records: records.length }
}

async function callTool({ mcp, toolName, input, label }: { mcp: McpTools, toolName: string, input: Record<string, unknown>, label: string }): Promise<ToolResult> {
    const { data, error } = await tryCatch(() => evalToolSet.call({ mcp, toolName, input }))
    if (!isNil(error)) {
        throw new Error(`could not seed ${label}: ${error.message}`)
    }
    const result = evalToolSet.readResult(data)
    if (result.failed) {
        throw new Error(`could not seed ${label}: ${result.text}`)
    }
    return result
}

function asTextRecord(record: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(record).map(([field, value]) => [field, textOf(value)]))
}

function textOf(value: unknown): string {
    if (isNil(value)) {
        return ''
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
}

const BUILD_FLOW_TOOL = 'ap_build_flow'
const CREATE_TABLE_TOOL = 'ap_create_table'
const INSERT_RECORDS_TOOL = 'ap_insert_records'
const INSERT_BATCH = 50

export const evalSeed = {
    create,
}

export type SeededFlow = { name: string, id: string }

export type SeededTable = { name: string, id: string, records: number }

export type SeededState = {
    flows: SeededFlow[]
    tables: SeededTable[]
}
