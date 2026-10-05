import { isNil, Permission, tryCatchSync, unique } from '@activepieces/core-utils'
import { Field, FlowActionType, flowStructureUtil, FlowTriggerType, McpToolDefinition, PopulatedFlow, ProjectScopedMcpServer, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { mcpUtils } from './mcp-utils'

const checkSolutionInput = z.object({
    folderName: mcpUtils.FOLDER_NAME_SCHEMA.unwrap().describe('The folder holding the solution (as created with ap_create_folder)'),
})

export const apCheckSolutionTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_check_solution',
        permission: Permission.READ_FLOW,
        description: 'Check that the flows and tables of a solution fit together, without running anything. For every flow in the folder it checks that each Call Flow step targets a real Callable Flow, sends every input key the subflow expects, and only waits for a response the subflow actually returns; that each Tables step and table trigger points at a real table and real fields; and that every flow passes validation. Run it after building a solution of several flows and tables, and fix every issue it reports.',
        inputSchema: checkSolutionInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { folderName } = checkSolutionInput.parse(args)
                const folder = await mcpUtils.resolveFolder({ projectId: mcp.projectId, folderName, log })
                if (folder.error) {
                    return folder.error
                }
                const { data: flows } = await flowService(log).list({ projectIds: [mcp.projectId], folderId: folder.folderId, includeTriggerSource: false })
                const steps = flows.flatMap((flow) => flowStructureUtil.getAllSteps(flow.version.trigger).map((step) => ({ flow, step })))
                const [targetsByExternalId, tablesByExternalId] = await Promise.all([
                    loadCallTargets({ projectId: mcp.projectId, externalIds: steps.flatMap(({ step }) => callFlowTarget(step) ?? []), log }),
                    loadTables({ projectId: mcp.projectId, externalIds: steps.flatMap(({ step }) => referencedTable(step) ?? []) }),
                ])
                const issues = [
                    ...flows.filter((flow) => !flow.version.valid).map((flow) => ({ flow, stepName: null, message: 'has invalid steps; fix them using ap_validate_flow' })),
                    ...steps.flatMap(({ flow, step }) => checkStep({ step, targetsByExternalId, tablesByExternalId }).map((message) => ({ flow, stepName: step.name, message }))),
                ]
                const lines = issues.map(({ flow, stepName, message }) => `- "${flow.version.displayName}"${isNil(stepName) ? '' : ` ${stepName}`}: ${message}`)
                const text = issues.length === 0
                    ? `✅ Solution "${folder.folderName}": ${flows.length} flows, every connection checks out.`
                    : `❌ Solution "${folder.folderName}": ${issues.length} issues across ${flows.length} flows. Fix each one, then run ap_check_solution again:\n${lines.join('\n')}`
                return {
                    content: [{ type: 'text', text }],
                    structuredContent: {
                        folderName: folder.folderName ?? null,
                        flowCount: flows.length,
                        ok: issues.length === 0,
                        issues: issues.map(({ flow, stepName, message }) => ({ flowId: flow.id, flowName: flow.version.displayName, stepName, message })),
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to check the solution', err)
            }
        },
    }
}

function checkStep({ step, targetsByExternalId, tablesByExternalId }: { step: Step, targetsByExternalId: Map<string, PopulatedFlow>, tablesByExternalId: Map<string, Field[]> }): string[] {
    const targetExternalId = callFlowTarget(step)
    const isCallFlow = isPieceStep({ step, pieceSuffix: SUBFLOWS_PIECE_SUFFIX, componentName: CALL_FLOW_ACTION })
    if (isCallFlow && isNil(targetExternalId)) {
        return ['Call Flow has no target flow selected']
    }
    if (!isNil(targetExternalId)) {
        return checkCallFlow({ step, target: targetsByExternalId.get(targetExternalId) })
    }
    const tableExternalId = referencedTable(step)
    if (!isNil(tableExternalId)) {
        return checkTableStep({ step, fields: tablesByExternalId.get(tableExternalId) })
    }
    return []
}

function checkCallFlow({ step, target }: { step: Step, target: PopulatedFlow | undefined }): string[] {
    if (isNil(target)) {
        return ['Call Flow targets a flow that does not exist in this project']
    }
    const targetName = target.version.displayName
    const targetIsCallable = isPieceStep({ step: target.version.trigger, pieceSuffix: SUBFLOWS_PIECE_SUFFIX, componentName: CALLABLE_FLOW_TRIGGER })
    if (!targetIsCallable) {
        return [`Call Flow targets "${targetName}", whose trigger is not a Callable Flow`]
    }
    const input = stepInput(step)
    const contract = parseObject(readPath({ value: stepInput(target.version.trigger), path: ['exampleData', 'sampleData'] }))
    const payload = parseObject(readPath({ value: input, path: ['flowProps', 'payload'] }))
    const missingKeys = isNil(contract) || isNil(payload) ? [] : Object.keys(contract).filter((key) => !(key in payload))
    const waitsForResponse = input['waitForResponse'] === true
    const subflowResponds = flowStructureUtil.getAllSteps(target.version.trigger).some((subflowStep) => isPieceStep({ step: subflowStep, pieceSuffix: SUBFLOWS_PIECE_SUFFIX, componentName: RETURN_RESPONSE_ACTION }))
    return [
        ...(missingKeys.length > 0 ? [`Call Flow to "${targetName}" does not send ${missingKeys.join(', ')}, which its Callable Flow sample data expects`] : []),
        ...(waitsForResponse && !subflowResponds ? [`Call Flow waits for a response, but "${targetName}" has no Return Response step`] : []),
    ]
}

function checkTableStep({ step, fields }: { step: Step, fields: Field[] | undefined }): string[] {
    if (isNil(fields)) {
        return ['points at a table that does not exist in this project']
    }
    const input = stepInput(step)
    const fieldExternalIds = new Set(fields.map((field) => field.externalId))
    const fieldNames = new Set(fields.map((field) => field.name))
    const rows = readPath({ value: input, path: ['values', 'values'] })
    const rowKeys = Array.isArray(rows) ? rows.flatMap((row) => Object.keys(parseObject(row) ?? {})) : []
    const updateKeys = componentName(step) === UPDATE_RECORD_ACTION ? Object.keys(parseObject(input['values']) ?? {}) : []
    const records = parseArray(input['records'])
    const recordKeys = isNil(records) ? [] : records.flatMap((record) => Object.keys(parseObject(record) ?? {}))
    const unknownFields = unique([
        ...[...rowKeys, ...updateKeys].filter((key) => !fieldExternalIds.has(key)),
        ...recordKeys.filter((key) => !fieldNames.has(key)),
    ])
    return unknownFields.length > 0 ? [`writes fields the table does not have: ${unknownFields.join(', ')}`] : []
}

async function loadCallTargets({ projectId, externalIds, log }: { projectId: string, externalIds: string[], log: FastifyBaseLogger }): Promise<Map<string, PopulatedFlow>> {
    if (externalIds.length === 0) {
        return new Map()
    }
    const { data } = await flowService(log).list({ projectIds: [projectId], externalIds: unique(externalIds), includeTriggerSource: false })
    return new Map(data.map((flow) => [flow.externalId, flow]))
}

async function loadTables({ projectId, externalIds }: { projectId: string, externalIds: string[] }): Promise<Map<string, Field[]>> {
    const requested = unique(externalIds)
    if (requested.length === 0) {
        return new Map()
    }
    const { data: tables } = await tableService.list({ projectId, cursor: undefined, limit: requested.length, name: undefined, externalIds: requested, folderId: undefined })
    const fieldsByTableId = await fieldService.getAllByTableIds({ projectId, tableIds: tables.map((table) => table.id) })
    return new Map(tables.map((table) => [table.externalId, fieldsByTableId.get(table.id) ?? []]))
}

function callFlowTarget(step: Step): string | undefined {
    if (!isPieceStep({ step, pieceSuffix: SUBFLOWS_PIECE_SUFFIX, componentName: CALL_FLOW_ACTION })) {
        return undefined
    }
    const flowId = stepInput(step)['flowId']
    return typeof flowId === 'string' && flowId.length > 0 ? flowId : undefined
}

function referencedTable(step: Step): string | undefined {
    if (!isPieceStep({ step, pieceSuffix: TABLES_PIECE_SUFFIX, componentName: undefined })) {
        return undefined
    }
    const tableId = stepInput(step)['table_id']
    return typeof tableId === 'string' && tableId.length > 0 ? tableId : undefined
}

function isPieceStep({ step, pieceSuffix, componentName: expected }: { step: Step, pieceSuffix: string, componentName: string | undefined }): boolean {
    const settings = asRecord(step.settings)
    const pieceName = settings['pieceName']
    const isPiece = step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE
    return isPiece && typeof pieceName === 'string' && pieceName.endsWith(pieceSuffix) && (isNil(expected) || componentName(step) === expected)
}

function componentName(step: Step): string | undefined {
    const settings = asRecord(step.settings)
    const name = settings['actionName'] ?? settings['triggerName']
    return typeof name === 'string' ? name : undefined
}

function stepInput(step: Step): Record<string, unknown> {
    return asRecord(asRecord(step.settings)['input'])
}

function readPath({ value, path }: { value: unknown, path: string[] }): unknown {
    return path.reduce<unknown>((current, key) => asRecord(current)[key], value)
}

function parseObject(value: unknown): Record<string, unknown> | null {
    const parsed = typeof value === 'string' ? parseJson(value) : value
    return typeof parsed === 'object' && !isNil(parsed) && !Array.isArray(parsed) ? asRecord(parsed) : null
}

function parseArray(value: unknown): unknown[] | null {
    const parsed = typeof value === 'string' ? parseJson(value) : value
    return Array.isArray(parsed) ? parsed : null
}

function parseJson(value: string): unknown {
    const { data } = tryCatchSync((): unknown => JSON.parse(value))
    return data ?? null
}

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {}
}

const SUBFLOWS_PIECE_SUFFIX = 'piece-subflows'
const TABLES_PIECE_SUFFIX = 'piece-tables'
const CALL_FLOW_ACTION = 'callFlow'
const CALLABLE_FLOW_TRIGGER = 'callableFlow'
const RETURN_RESPONSE_ACTION = 'returnResponse'
const UPDATE_RECORD_ACTION = 'tables-update-record'
