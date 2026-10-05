import { isNil, isObject, Permission, tryCatchSync, unique } from '@activepieces/core-utils'
import { Field, FlowActionType, flowStructureUtil, FlowTriggerType, McpToolContext, McpToolDefinition, PopulatedFlow, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { resolvePermissionChecker } from '../mcp-permissions'
import { flowValidation } from './ap-validate-flow'
import { mcpUtils } from './mcp-utils'

const checkSolutionInput = z.object({
    folderName: mcpUtils.FOLDER_NAME_SCHEMA.unwrap().describe('The folder holding the solution (as created with ap_create_folder)'),
})

export const apCheckSolutionTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_check_solution',
        permission: Permission.READ_FLOW,
        description: 'Check that the flows and tables of a solution fit together, without running anything. For every flow in the folder it checks that each Call Flow step targets a real Callable Flow, sends every input key the subflow expects, and only waits for a response the subflow actually returns; that each Tables step and table trigger points at a real table and real fields; and that every flow passes validation. Run it after building a solution of several flows and tables, and fix every issue it reports.',
        inputSchema: checkSolutionInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { folderName } = checkSolutionInput.parse(args)
                const [folder, canReadTables] = await Promise.all([
                    mcpUtils.resolveFolder({ projectId: mcp.projectId, folderName, log }),
                    callerCanReadTables({ userId, projectId: mcp.projectId, log }),
                ])
                if (folder.error) {
                    return folder.error
                }
                const { data: flows } = await flowService(log).list({ projectIds: [mcp.projectId], folderId: folder.folderId, includeTriggerSource: false })
                const allSteps = flows.flatMap((flow) => flowStructureUtil.getAllSteps(flow.version.trigger).map((step) => ({ flow, step })))
                const steps = allSteps.filter(({ step }) => canReadTables || !isTableStep(step))
                const unchecked = allSteps.flatMap(({ flow, step }) => {
                    const reason = uncheckedReason({ step, canReadTables })
                    return isNil(reason) ? [] : [{ flow, stepName: step.name, message: reason }]
                })
                const [targetsByExternalId, tablesByExternalId] = await Promise.all([
                    loadCallTargets({ projectId: mcp.projectId, folderFlows: flows, externalIds: steps.flatMap(({ step }) => callReference(step) ?? []), log }),
                    loadTables({ projectId: mcp.projectId, externalIds: steps.flatMap(({ step }) => tableReference(step) ?? []) }),
                ])
                const issues = [
                    ...flows.flatMap(validationIssues),
                    ...steps.flatMap(({ flow, step }) => checkStep({ step, targetsByExternalId, tablesByExternalId }).map((message) => ({ flow, stepName: step.name, message }))),
                ]
                return {
                    content: [{ type: 'text', text: summarize({ folderName: folder.folderName, flowCount: flows.length, issues, unchecked }) }],
                    structuredContent: {
                        folderName: folder.folderName ?? null,
                        flowCount: flows.length,
                        ok: issues.length === 0 && unchecked.length === 0,
                        tablesChecked: canReadTables,
                        issues: issues.map(toReportEntry),
                        unchecked: unchecked.map(toReportEntry),
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to check the solution', err)
            }
        },
    }
}

function validationIssues(flow: PopulatedFlow): SolutionIssue[] {
    return flowValidation.blockingIssues(flowValidation.validateFlow({ trigger: flow.version.trigger }).issues)
        .map((issue) => ({ flow, stepName: issue.stepName, message: issue.message }))
}

function summarize({ folderName, flowCount, issues, unchecked }: { folderName: string | undefined, flowCount: number, issues: SolutionIssue[], unchecked: SolutionIssue[] }): string {
    const flowWord = flowCount === 1 ? 'flow' : 'flows'
    const uncheckedPart = unchecked.length === 0 ? '' : `\nThese connections could not be checked, so the solution is not verified:\n${unchecked.map(formatLine).join('\n')}`
    if (issues.length > 0) {
        const issueWord = issues.length === 1 ? 'issue' : 'issues'
        return `❌ Solution "${folderName}": ${issues.length} ${issueWord} across ${flowCount} ${flowWord}. Fix each one, then run ap_check_solution again:\n${issues.map(formatLine).join('\n')}${uncheckedPart}`
    }
    if (unchecked.length > 0) {
        return `⚠️ Solution "${folderName}": no problems in what could be checked across ${flowCount} ${flowWord}, but it is not fully verified.${uncheckedPart}`
    }
    return `✅ Solution "${folderName}": ${flowCount} ${flowWord}, every connection checks out.`
}

function formatLine({ flow, stepName, message }: SolutionIssue): string {
    return `- "${flow.version.displayName}" ${stepName}: ${message}`
}

function toReportEntry({ flow, stepName, message }: SolutionIssue): { flowId: string, flowName: string, stepName: string, message: string } {
    return { flowId: flow.id, flowName: flow.version.displayName, stepName, message }
}

function uncheckedReason({ step, canReadTables }: { step: Step, canReadTables: boolean }): string | undefined {
    if (isPieceStep({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALL_FLOW_ACTION })) {
        const isDynamicTarget = isFilled(stepInput(step)['flowId']) && isNil(callReference(step))
        return isDynamicTarget ? 'Call Flow target is set by an expression, so this call could not be checked' : undefined
    }
    if (!isTableStep(step)) {
        return undefined
    }
    if (!canReadTables) {
        return 'table step not checked: your role cannot read tables'
    }
    const isDynamicTable = isFilled(stepInput(step)['table_id']) && isNil(tableReference(step))
    return isDynamicTable ? 'table is set by an expression, so this step could not be checked' : undefined
}

function isTableStep(step: Step): boolean {
    return isPieceStep({ step, pieceName: TABLES_PIECE_NAME, componentName: undefined })
}

function isFilled(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0
}

function checkStep({ step, targetsByExternalId, tablesByExternalId }: { step: Step, targetsByExternalId: Map<string, PopulatedFlow>, tablesByExternalId: Map<string, Field[]> }): string[] {
    if (isPieceStep({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALL_FLOW_ACTION })) {
        if (!isFilled(stepInput(step)['flowId'])) {
            return ['Call Flow has no target flow selected']
        }
        const targetExternalId = callReference(step)
        return isNil(targetExternalId) ? [] : checkCallFlow({ step, target: targetsByExternalId.get(targetExternalId) })
    }
    const tableExternalId = tableReference(step)
    return isNil(tableExternalId) ? [] : checkTableStep({ step, fields: tablesByExternalId.get(tableExternalId) })
}

function checkCallFlow({ step, target }: { step: Step, target: PopulatedFlow | undefined }): string[] {
    if (isNil(target)) {
        return ['Call Flow targets a flow that does not exist in this project']
    }
    const targetName = target.version.displayName
    if (!isPieceStep({ step: target.version.trigger, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALLABLE_FLOW_TRIGGER })) {
        return [`Call Flow targets "${targetName}", whose trigger is not a Callable Flow`]
    }
    const input = stepInput(step)
    const contract = parseObject(readPath({ value: stepInput(target.version.trigger), path: ['exampleData', 'sampleData'] }))
    const rawPayload = readPath({ value: input, path: ['flowProps', 'payload'] })
    const payload = isNil(rawPayload) ? {} : parseObject(rawPayload)
    const missingKeys = isNil(contract) || isNil(payload) ? [] : Object.keys(contract).filter((key) => !(key in payload))
    const waitsForResponse = input['waitForResponse'] === true || input['waitForResponse'] === 'true'
    return [
        ...(missingKeys.length > 0 ? [`Call Flow to "${targetName}" does not send ${missingKeys.join(', ')}, which its Callable Flow sample data expects`] : []),
        ...(waitsForResponse && !hasReturnResponse(target) ? [`Call Flow waits for a response, but "${targetName}" has no Return Response step`] : []),
    ]
}

function checkTableStep({ step, fields }: { step: Step, fields: Field[] | undefined }): string[] {
    if (isNil(fields)) {
        return ['points at a table that does not exist in this project']
    }
    const input = stepInput(step)
    const fieldExternalIds = new Set(fields.map((field) => field.externalId))
    const fieldNames = new Set(fields.map((field) => field.name))
    const rowKeys = toArray(readPath({ value: input, path: ['values', 'values'] })).flatMap((row) => Object.keys(parseObject(row) ?? {}))
    const updateKeys = componentName(step) === UPDATE_RECORD_ACTION ? Object.keys(parseObject(input['values']) ?? {}) : []
    const recordKeys = toArray(parseJsonString(input['records'])).flatMap((record) => Object.keys(parseObject(record) ?? {}))
    const unknownFields = unique([
        ...[...rowKeys, ...updateKeys].filter((key) => !fieldExternalIds.has(key)),
        ...recordKeys.filter((key) => !fieldNames.has(key)),
    ])
    return unknownFields.length > 0 ? [`writes fields the table does not have: ${unknownFields.join(', ')}`] : []
}

function hasReturnResponse(flow: PopulatedFlow): boolean {
    return flowStructureUtil.getAllSteps(flow.version.trigger).some((step) => isPieceStep({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: RETURN_RESPONSE_ACTION }))
}

async function callerCanReadTables({ userId, projectId, log }: { userId: string | undefined, projectId: string, log: FastifyBaseLogger }): Promise<boolean> {
    if (isNil(userId)) {
        return true
    }
    const checker = await resolvePermissionChecker({ userId, projectId, log })
    return isNil(checker.check(Permission.READ_TABLE, 'ap_check_solution'))
}

async function loadCallTargets({ projectId, folderFlows, externalIds, log }: { projectId: string, folderFlows: PopulatedFlow[], externalIds: string[], log: FastifyBaseLogger }): Promise<Map<string, PopulatedFlow>> {
    const inFolder = new Map(folderFlows.map((flow) => [flow.externalId, flow]))
    const outsideFolder = unique(externalIds).filter((externalId) => !inFolder.has(externalId))
    if (outsideFolder.length === 0) {
        return inFolder
    }
    const { data } = await flowService(log).list({ projectIds: [projectId], externalIds: outsideFolder, includeTriggerSource: false })
    return new Map([...inFolder, ...data.map((flow): [string, PopulatedFlow] => [flow.externalId, flow])])
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

function callReference(step: Step): string | undefined {
    return staticInputRef({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALL_FLOW_ACTION, key: 'flowId' })
}

function tableReference(step: Step): string | undefined {
    return staticInputRef({ step, pieceName: TABLES_PIECE_NAME, componentName: undefined, key: 'table_id' })
}

function staticInputRef({ step, pieceName, componentName: expected, key }: { step: Step, pieceName: string, componentName: string | undefined, key: string }): string | undefined {
    return isPieceStep({ step, pieceName, componentName: expected }) ? staticId(stepInput(step)[key]) : undefined
}

function staticId(value: unknown): string | undefined {
    return isFilled(value) && typeof value === 'string' && !value.includes('{{') ? value : undefined
}

function isPieceStep({ step, pieceName, componentName: expected }: { step: Step, pieceName: string, componentName: string | undefined }): boolean {
    const isPiece = step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE
    return isPiece && asRecord(step.settings)['pieceName'] === pieceName && (isNil(expected) || componentName(step) === expected)
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
    const parsed = parseJsonString(value)
    return isObject(parsed) ? parsed : null
}

function toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value
    }
    return isNil(value) ? [] : [value]
}

function parseJsonString(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }
    const { data } = tryCatchSync((): unknown => JSON.parse(value))
    return data ?? null
}

function asRecord(value: unknown): Record<string, unknown> {
    return isObject(value) ? value : {}
}

const SUBFLOWS_PIECE_NAME = '@activepieces/piece-subflows'
const TABLES_PIECE_NAME = '@activepieces/piece-tables'
const CALL_FLOW_ACTION = 'callFlow'
const CALLABLE_FLOW_TRIGGER = 'callableFlow'
const RETURN_RESPONSE_ACTION = 'returnResponse'
const UPDATE_RECORD_ACTION = 'tables-update-record'

type SolutionIssue = {
    flow: PopulatedFlow
    stepName: string
    message: string
}
