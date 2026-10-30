import { isNil, isObject, Permission, tryCatch, tryCatchSync, unique } from '@activepieces/core-utils'
import { Field, FlowActionType, flowStructureUtil, FlowTriggerType, McpToolResult, PopulatedFlow, ProjectScopedMcpServer, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { resolvePermissionChecker } from '../mcp-permissions'
import { flowValidation } from './flow-validation'
import { mcpUtils } from './mcp-utils'

async function validate({ mcp, userId, folderName, log }: { mcp: ProjectScopedMcpServer, userId: string | undefined, folderName: string, log: FastifyBaseLogger }): Promise<McpToolResult> {
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
        return isNil(reason) ? [] : [{ flow, step, message: reason }]
    })
    const [targetsByExternalId, tablesByExternalId] = await Promise.all([
        loadCallTargets({ projectId: mcp.projectId, folderFlows: flows, externalIds: steps.flatMap(({ step }) => callReference(step) ?? []), log }),
        loadTables({ projectId: mcp.projectId, externalIds: steps.flatMap(({ step }) => tableReference(step) ?? []) }),
    ])
    const issues = [
        ...flows.flatMap(validationIssues),
        ...flows.flatMap(subflowInputIssues),
        ...steps.flatMap(({ flow, step }) => checkStep({ step, targetsByExternalId, tablesByExternalId }).map((message) => ({ flow, step, message }))),
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

function validationIssues(flow: PopulatedFlow): SolutionIssue[] {
    return flowValidation.blockingIssues(flowValidation.validateFlow({ trigger: flow.version.trigger }).issues)
        .flatMap((issue) => {
            const step = flowStructureUtil.getAllSteps(flow.version.trigger).find((candidate) => candidate.name === issue.stepName)
            return isNil(step) ? [] : [{ flow, step, message: issue.message }]
        })
}

function subflowInputIssues(flow: PopulatedFlow): SolutionIssue[] {
    if (!isPieceStep({ step: flow.version.trigger, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALLABLE_FLOW_TRIGGER })) {
        return []
    }
    return flowStructureUtil.getAllSteps(flow.version.trigger).flatMap((step) => {
        const misreadKeys = unique(stringLeaves(step.settings).flatMap((text) => [...text.matchAll(TRIGGER_OUTPUT_KEY_PATTERN)].map((match) => match[1] ?? match[2])))
            .filter((key) => !CALLABLE_FLOW_OUTPUT_KEYS.includes(key))
        if (misreadKeys.length === 0) {
            return []
        }
        const fixes = misreadKeys.map((key) => `{{trigger['output'].${key}}} → {{trigger['output'].data.${key}}}`).join(', ')
        return [{ flow, step, message: `reads the subflow's inputs from the wrong place, so they are empty at run time. A Callable Flow puts its inputs under data: ${fixes}` }]
    })
}

function summarize({ folderName, flowCount, issues, unchecked }: { folderName: string | undefined, flowCount: number, issues: SolutionIssue[], unchecked: SolutionIssue[] }): string {
    const flowWord = flowCount === 1 ? 'flow' : 'flows'
    const uncheckedPart = unchecked.length === 0 ? '' : `\nThese connections could not be checked, so the solution is not verified:\n${unchecked.map(formatLine).join('\n')}`
    if (issues.length > 0) {
        const issueWord = issues.length === 1 ? 'issue' : 'issues'
        return `⚠️ Solution "${folderName}": ${issues.length} ${issueWord} across ${flowCount} ${flowWord}. Fix each one, then run ap_validate_flow with this folderName again:\n${issues.map(formatLine).join('\n')}${uncheckedPart}`
    }
    if (unchecked.length > 0) {
        return `⚠️ Solution "${folderName}": no problems in what could be checked across ${flowCount} ${flowWord}, but it is not fully verified.${uncheckedPart}`
    }
    return `✅ Solution "${folderName}": ${flowCount} ${flowWord}, every connection checks out.`
}

function formatLine({ flow, step, message }: SolutionIssue): string {
    return `- "${flow.version.displayName}" › "${step.displayName}": ${message}`
}

function toReportEntry({ flow, step, message }: SolutionIssue): { flowId: string, flowName: string, stepName: string, stepDisplayName: string, message: string } {
    return { flowId: flow.id, flowName: flow.version.displayName, stepName: step.name, stepDisplayName: step.displayName, message }
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
    const isDynamicTable = isNil(tableReference(step))
    return isDynamicTable ? 'table is set by an expression, so this step could not be checked' : undefined
}

function isTableStep(step: Step): boolean {
    return isPieceStep({ step, pieceName: TABLES_PIECE_NAME, componentName: undefined }) && isFilled(stepInput(step)['table_id'])
}

function isFilled(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0
}

function checkStep({ step, targetsByExternalId, tablesByExternalId }: { step: Step, targetsByExternalId: Map<string, PopulatedFlow>, tablesByExternalId: Map<string, SolutionTable> }): string[] {
    if (isPieceStep({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: CALL_FLOW_ACTION })) {
        if (!isFilled(stepInput(step)['flowId'])) {
            return ['Call Flow has no target flow selected']
        }
        const targetExternalId = callReference(step)
        return isNil(targetExternalId) ? [] : checkCallFlow({ step, target: targetsByExternalId.get(targetExternalId) })
    }
    const isTableTriggerWithoutTable = step.type === FlowTriggerType.PIECE && isPieceStep({ step, pieceName: TABLES_PIECE_NAME, componentName: undefined }) && !isFilled(stepInput(step)['table_id'])
    if (isTableTriggerWithoutTable) {
        return ['table trigger has no table selected']
    }
    const tableExternalId = tableReference(step)
    return isNil(tableExternalId) ? [] : checkTableStep({ step, table: tablesByExternalId.get(tableExternalId) })
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
    const payloadSchemaSaved = !isNil(readPath({ value: step.settings, path: ['propertySettings', 'flowProps', 'schema'] }))
    const sendsPayloadAsText = typeof rawPayload === 'string' && !payloadSchemaSaved && readsInputFields(target)
    return [
        ...(sendsPayloadAsText ? [`Call Flow sends its payload as JSON text, so "${targetName}" receives one string instead of its inputs. Set mode to "simple" and flowProps.payload to an object`] : []),
        ...(missingKeys.length > 0 ? [`Call Flow to "${targetName}" does not send ${missingKeys.join(', ')}, which its Callable Flow sample data expects`] : []),
        ...(waitsForResponse && !hasReturnResponse(target) ? [`Call Flow waits for a response, but "${targetName}" has no Return Response step`] : []),
    ]
}

function checkTableStep({ step, table }: { step: Step, table: SolutionTable | undefined }): string[] {
    if (isNil(table)) {
        return ['points at a table that does not exist in this project']
    }
    const { name: tableName, fields } = table
    if (table.usesInternalId) {
        return [`sets table_id to table "${tableName}"'s internal id; the Tables piece needs its externalId: set table_id to ${table.externalId}`]
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
    if (unknownFields.length === 0) {
        return []
    }
    const validFields = fields.map((field) => `"${field.name}" → ${field.externalId}`).join(', ')
    return [`writes fields table "${tableName}" does not have: ${unknownFields.join(', ')}. Key form values by field externalId (raw records JSON by field name). Valid fields: ${validFields || 'none'}`]
}

function stringLeaves(value: unknown): string[] {
    if (typeof value === 'string') {
        return [value]
    }
    if (Array.isArray(value)) {
        return value.flatMap(stringLeaves)
    }
    return isObject(value) ? Object.values(value).flatMap(stringLeaves) : []
}

function readsInputFields(flow: PopulatedFlow): boolean {
    return flowStructureUtil.getAllSteps(flow.version.trigger).some((step) => stringLeaves(step.settings).some((text) => INPUT_FIELD_REFERENCE_PATTERN.test(text)))
}

function hasReturnResponse(flow: PopulatedFlow): boolean {
    return flowStructureUtil.getAllSteps(flow.version.trigger).some((step) => isPieceStep({ step, pieceName: SUBFLOWS_PIECE_NAME, componentName: RETURN_RESPONSE_ACTION }))
}

async function callerCanReadTables({ userId, projectId, log }: { userId: string | undefined, projectId: string, log: FastifyBaseLogger }): Promise<boolean> {
    if (isNil(userId)) {
        return true
    }
    const checker = await resolvePermissionChecker({ userId, projectId, log })
    return isNil(checker.check(Permission.READ_TABLE, 'ap_validate_flow'))
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

async function loadTables({ projectId, externalIds }: { projectId: string, externalIds: string[] }): Promise<Map<string, SolutionTable>> {
    const requested = unique(externalIds)
    if (requested.length === 0) {
        return new Map()
    }
    const { data: byExternalId } = await tableService.list({ projectId, cursor: undefined, limit: requested.length, name: undefined, externalIds: requested, folderId: undefined })
    const foundExternalIds = new Set(byExternalId.map((table) => table.externalId))
    const byInternalId = await Promise.all(requested.filter((reference) => !foundExternalIds.has(reference)).map(async (reference) => {
        const { data: table } = await tryCatch(() => tableService.getOneOrThrow({ projectId, id: reference }))
        return isNil(table) ? [] : [{ reference, table }]
    }))
    const matches = [
        ...byExternalId.map((table) => ({ reference: table.externalId, table, usesInternalId: false })),
        ...byInternalId.flat().map(({ reference, table }) => ({ reference, table, usesInternalId: true })),
    ]
    const fieldsByTableId = await fieldService.getAllByTableIds({ projectId, tableIds: matches.map(({ table }) => table.id) })
    return new Map(matches.map(({ reference, table, usesInternalId }) => [reference, { name: table.name, externalId: table.externalId, usesInternalId, fields: fieldsByTableId.get(table.id) ?? [] }]))
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

export const solutionValidation = {
    validate,
}

const SUBFLOWS_PIECE_NAME = '@activepieces/piece-subflows'
const TABLES_PIECE_NAME = '@activepieces/piece-tables'
const CALL_FLOW_ACTION = 'callFlow'
const CALLABLE_FLOW_TRIGGER = 'callableFlow'
const RETURN_RESPONSE_ACTION = 'returnResponse'
const CALLABLE_FLOW_OUTPUT_KEYS = ['data', 'callbackUrl']
const TRIGGER_OUTPUT_SOURCE = String.raw`trigger(?:\.output|\[['"]output['"]\])`
const INPUT_FIELD_REFERENCE_PATTERN = new RegExp(String.raw`${TRIGGER_OUTPUT_SOURCE}(?:\.data|\[['"]data['"]\])(?:\.|\[)`)
const TRIGGER_OUTPUT_KEY_PATTERN = new RegExp(String.raw`${TRIGGER_OUTPUT_SOURCE}(?:\.([A-Za-z_$][\w$]*)|\[['"]([^'"\]]+)['"]\])`, 'g')
const UPDATE_RECORD_ACTION = 'tables-update-record'

type SolutionIssue = {
    flow: PopulatedFlow
    step: Step
    message: string
}

type SolutionTable = {
    name: string
    externalId: string
    usesInternalId: boolean
    fields: Field[]
}
