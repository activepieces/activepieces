import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { agentToolClassification, agentToolSkills } from '@activepieces/shared'
import { z } from 'zod'
import { evalAgentTurn, TurnOutcome, TurnToolCall } from './agent-turn'
import { RunVerdict } from './checks'
import { declinedSteps } from './declined-steps'
import { CodeChecks } from './eval-case'
import { replay } from './replay'
import { evalToolSet, McpTools } from './tool-set'

async function run({ checks, outcome, mcp, declinedPieces = [] }: { checks: CodeChecks, outcome: CheckedOutcome, mcp: McpTools, declinedPieces?: string[] }): Promise<CodeCheckResult> {
    const deletedFlows = new Set(succeededCalls(outcome).filter((call) => call.toolName === DELETE_FLOW_TOOL && landed(call)).flatMap(flowIdOf))
    const flowIds = evalAgentTurn.changedFlowIds(outcome.toolCalls).filter((flowId) => !deletedFlows.has(flowId))
    const flowProblems = checks.skipFlowValidates === true ? [] : await invalidFlows({ mcp, flowIds, declined: new Set(declinedPieces) })
    return resultOf([...declaredProblems({ checks, outcome }), ...flowProblems])
}

function declaredProblems({ checks, outcome }: { checks: CodeChecks, outcome: CheckedOutcome }): string[] {
    const calls = succeededCalls(outcome)
    const cards = new Set([...outcome.cardsShown, ...calls.flatMap((call) => call.toolName.startsWith(CARD_PREFIX) ? [call.toolName] : [])])
    const writes = unique([...calls.filter(landed), ...effectiveCalls(outcome).filter(rollbackFailed)].flatMap(writesOf))
    const deletes = unique(calls.filter(landed).flatMap(deletesOf))
    return [
        checks.noQuestionCards === true && cards.has(QUESTIONS_CARD) ? `showed a questions card (${QUESTIONS_CARD}), the case expects none` : null,
        !isNil(checks.cardShown) && !cards.has(checks.cardShown) ? `never showed ${checks.cardShown}${cards.size === 0 ? '' : ` (showed ${[...cards].join(', ')})`}` : null,
        checks.noWrites === true && writes.length > 0 ? `changed data, the case expects no writes: ${writes.join(', ')}` : null,
        checks.noDeletes === true && deletes.length > 0 ? `deleted something, the case expects no deletes: ${deletes.join(', ')}` : null,
    ].flatMap((problem) => isNil(problem) ? [] : [problem])
}

function succeededCalls(outcome: CheckedOutcome): TurnToolCall[] {
    return effectiveCalls(outcome).filter((call) => !call.errored)
}

function effectiveCalls(outcome: CheckedOutcome): TurnToolCall[] {
    return outcome.toolCalls.map((call) => ({ ...call, ...agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input }) }))
}

function landed(call: TurnToolCall): boolean {
    return !evalToolSet.readResult(call.output).failed
}

function rollbackFailed(call: TurnToolCall): boolean {
    return evalToolSet.readResult(call.output).structured['rolledBack'] === false
}

async function invalidFlows({ mcp, flowIds, declined }: { mcp: McpTools, flowIds: string[], declined: Set<string> }): Promise<string[]> {
    const problems = await Promise.all(flowIds.map(async (flowId) => {
        const { data, error } = await tryCatch(() => evalToolSet.call({ mcp, toolName: VALIDATE_FLOW_TOOL, input: { flowId } }))
        if (!isNil(error)) {
            return [`could not validate flow ${flowId}: ${error.message}`]
        }
        const { failed, text, structured } = evalToolSet.readResult(data)
        if (structured['valid'] === false) {
            const issues = await realIssues({ mcp, flowId, issues: issuesOf(structured), invalidSteps: structured['invalidSteps'], declined })
            return issues.length === 0 ? [] : [`flow ${flowId} is not valid: ${describeIssues(issues)}`]
        }
        return structured['valid'] === true && !failed ? [] : [`could not validate flow ${flowId}: ${text}`]
    }))
    return problems.flat()
}

function issuesOf(structured: Record<string, unknown>): ValidationIssue[] {
    const issues = Array.isArray(structured['issues']) ? structured['issues'] : []
    return issues.flatMap((issue) => {
        const parsed = ValidationIssue.safeParse(issue)
        return parsed.success && parsed.data.severity !== INFO_SEVERITY ? [parsed.data] : []
    })
}

function describeIssues(issues: ValidationIssue[]): string {
    return issues.slice(0, MAX_ISSUES).map((issue) => `${isNil(issue.stepName) ? '' : `${issue.stepName}: `}${issue.message}`).join('; ')
}

async function realIssues({ mcp, flowId, issues, invalidSteps, declined }: { mcp: McpTools, flowId: string, issues: ValidationIssue[], invalidSteps: unknown, declined: Set<string> }): Promise<ValidationIssue[]> {
    if (issues.length === 0) {
        return invalidSteps === 1 && await declinedSteps.onlyMissesConnection({ mcp, flowId, stepName: TRIGGER_STEP, declined }) ? [] : [{ message: 'ap_validate_flow reported it invalid' }]
    }
    const checked = await Promise.all(issues.map(async (issue) => issue.category === STEP_VALIDITY && !isNil(issue.stepName) && await declinedSteps.onlyMissesConnection({ mcp, flowId, stepName: issue.stepName, declined }) ? [] : [issue]))
    return checked.flat()
}

function writesOf(call: TurnToolCall): string[] {
    if (call.toolName === EXECUTE_ACTION_TOOL) {
        const action = actionOf(call)
        return isNil(action) || agentToolClassification.isReadOnlyActionCall({ actionName: action.name, input: action.input }) ? [] : [describeAction({ call, action })]
    }
    return WRITE_TOOLS.has(call.toolName) ? [call.toolName] : []
}

function deletesOf(call: TurnToolCall): string[] {
    if (call.toolName.startsWith(DELETE_PREFIX)) {
        return [call.toolName]
    }
    if (call.toolName === EXECUTE_ACTION_TOOL) {
        const action = actionOf(call)
        return !isNil(action) && isDeleteAction(action) ? [describeAction({ call, action })] : []
    }
    if (call.toolName === APPLY_FLOW_OPERATIONS_TOOL) {
        const operations = isObject(call.input) && Array.isArray(call.input['operations']) ? call.input['operations'] : []
        return operations.flatMap((operation) => isObject(operation) && typeof operation['type'] === 'string' && operation['type'].startsWith(DELETE_OPERATION_PREFIX) ? [`${call.toolName} (${operation['type']})`] : [])
    }
    if (MANAGE_TOOLS.has(call.toolName)) {
        return isObject(call.input) && call.input['operation'] === DELETE_OPERATION ? [`${call.toolName} (${DELETE_OPERATION})`] : []
    }
    return []
}

function isDeleteAction(action: ActionCall): boolean {
    if (action.name === CUSTOM_API_CALL_ACTION) {
        const method = action.input?.['method']
        return typeof method === 'string' && method.toUpperCase() === DELETE_METHOD
    }
    return DELETE_ACTION_PATTERN.test(action.name)
}

function actionOf(call: TurnToolCall): ActionCall | null {
    if (!isObject(call.input) || typeof call.input['actionName'] !== 'string') {
        return null
    }
    return { name: call.input['actionName'], input: isObject(call.input['input']) ? call.input['input'] : undefined }
}

function describeAction({ call, action }: { call: TurnToolCall, action: ActionCall }): string {
    return `${call.toolName} (${action.name})`
}

function flowIdOf(call: TurnToolCall): string[] {
    return isObject(call.input) && typeof call.input['flowId'] === 'string' ? [call.input['flowId']] : []
}

function unique(values: string[]): string[] {
    return [...new Set(values)]
}

function resultOf(problems: string[]): CodeCheckResult {
    return problems.length === 0 ? { verdict: 'pass', reason: 'Every code check passed' } : { verdict: 'fail', reason: problems.join(' | ') }
}

const QUESTIONS_CARD = 'ap_show_questions'
const CARD_PREFIX = 'ap_show_'
const DELETE_PREFIX = 'ap_delete_'
const DELETE_FLOW_TOOL = 'ap_delete_flow'
const EXECUTE_ACTION_TOOL = 'ap_execute_action'
const APPLY_FLOW_OPERATIONS_TOOL = 'ap_apply_flow_operations'
const VALIDATE_FLOW_TOOL = 'ap_validate_flow'
const MANAGE_TOOLS = new Set(['ap_manage_fields', 'ap_manage_notes'])
const DELETE_OPERATION = 'DELETE'
const DELETE_OPERATION_PREFIX = 'delete_'
const CUSTOM_API_CALL_ACTION = 'custom_api_call'
const DELETE_METHOD = 'DELETE'
const DELETE_ACTION_PATTERN = /(^|[_\-.])delete([_\-.]|$)/i
const MAX_ISSUES = 5
const INFO_SEVERITY = 'info'
const STEP_VALIDITY = 'step_validity'
const ValidationIssue = z.object({ category: z.string().optional(), severity: z.string().optional(), stepName: z.string().optional(), message: z.string() })
const SIDE_EFFECT_TOOLS = [
    'ap_add_agent_tool',
    'ap_change_flow_status',
    'ap_create_agent',
    'ap_lock_and_publish',
    'ap_remove_agent_tool',
    'ap_retry_run',
    'ap_run_action',
    'ap_send_email',
    'ap_update_agent',
]
const TRIGGER_STEP = 'trigger'
const WRITE_TOOLS = new Set([...replay.workspaceWriteTools, ...SIDE_EFFECT_TOOLS])
const NOT_RUN: CodeCheckResult = { verdict: 'pass', reason: 'No code checks: they run on live cases only' }

export const evalCodeChecks = {
    run,
    declaredProblems,
    notRun: NOT_RUN,
}

type CheckedOutcome = Pick<TurnOutcome, 'toolCalls' | 'cardsShown'>

type ValidationIssue = z.infer<typeof ValidationIssue>

type ActionCall = { name: string, input: Record<string, unknown> | undefined }

export type CodeCheckResult = {
    verdict: RunVerdict
    reason: string
}
