import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { agentToolClassification, agentToolSkills } from '@activepieces/shared'
import { evalAgentTurn, TurnOutcome, TurnToolCall } from './agent-turn'
import { RunVerdict } from './checks'
import { CodeChecks } from './eval-case'
import { replay } from './replay'
import { evalToolSet, McpTools } from './tool-set'

async function run({ checks, outcome, mcp }: { checks: CodeChecks, outcome: CheckedOutcome, mcp: McpTools }): Promise<CodeCheckResult> {
    const flowProblems = checks.skipFlowValidates === true ? [] : await invalidFlows({ mcp, flowIds: evalAgentTurn.changedFlowIds(outcome.toolCalls) })
    return resultOf([...declaredProblems({ checks, outcome }), ...flowProblems])
}

function declaredProblems({ checks, outcome }: { checks: CodeChecks, outcome: CheckedOutcome }): string[] {
    const calls = outcome.toolCalls.map((call) => ({ ...call, ...agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input }) }))
    const cards = new Set([...outcome.cardsShown, ...calls.flatMap((call) => call.toolName.startsWith(CARD_PREFIX) ? [call.toolName] : [])])
    const writes = unique(calls.filter(isWrite).map(describeCall))
    const deletes = unique(calls.filter(isDelete).map(describeCall))
    return [
        checks.noQuestionCards === true && cards.has(QUESTIONS_CARD) ? `showed a questions card (${QUESTIONS_CARD}), the case expects none` : null,
        !isNil(checks.cardShown) && !cards.has(checks.cardShown) ? `never showed ${checks.cardShown}${cards.size === 0 ? '' : ` (showed ${[...cards].join(', ')})`}` : null,
        checks.noWrites === true && writes.length > 0 ? `changed data, the case expects no writes: ${writes.join(', ')}` : null,
        checks.noDeletes === true && deletes.length > 0 ? `deleted something, the case expects no deletes: ${deletes.join(', ')}` : null,
    ].flatMap((problem) => isNil(problem) ? [] : [problem])
}

async function invalidFlows({ mcp, flowIds }: { mcp: McpTools, flowIds: string[] }): Promise<string[]> {
    const problems = await Promise.all(flowIds.map(async (flowId) => {
        const { data, error } = await tryCatch(() => evalToolSet.call({ mcp, toolName: VALIDATE_FLOW_TOOL, input: { flowId } }))
        if (!isNil(error)) {
            return [`could not validate flow ${flowId}: ${error.message}`]
        }
        const { structured } = evalToolSet.readResult(data)
        return structured['valid'] === false ? [`flow ${flowId} is not valid: ${issuesOf(structured)}`] : []
    }))
    return problems.flat()
}

function issuesOf(structured: Record<string, unknown>): string {
    const issues = Array.isArray(structured['issues']) ? structured['issues'] : []
    const lines = issues.flatMap((issue) => isObject(issue) && typeof issue['message'] === 'string' ? [`${typeof issue['stepName'] === 'string' ? `${issue['stepName']}: ` : ''}${issue['message']}`] : [])
    return lines.length === 0 ? 'ap_validate_flow reported it invalid' : lines.slice(0, MAX_ISSUES).join('; ')
}

function isWrite(call: TurnToolCall): boolean {
    if (replay.isRead(call.toolName) || NOT_DATA_TOOLS.has(call.toolName) || call.toolName.startsWith(CARD_PREFIX)) {
        return false
    }
    if (call.toolName !== EXECUTE_ACTION_TOOL) {
        return true
    }
    const actionName = actionNameOf(call)
    return isNil(actionName) || !agentToolClassification.isReadOnlyActionCall({ actionName, input: isObject(call.input) && isObject(call.input['input']) ? call.input['input'] : undefined })
}

function isDelete(call: TurnToolCall): boolean {
    if (call.toolName.startsWith(DELETE_PREFIX)) {
        return true
    }
    const actionName = call.toolName === EXECUTE_ACTION_TOOL ? actionNameOf(call) : null
    return !isNil(actionName) && DELETE_ACTION_PATTERN.test(actionName)
}

function actionNameOf(call: TurnToolCall): string | null {
    return isObject(call.input) && typeof call.input['actionName'] === 'string' ? call.input['actionName'] : null
}

function describeCall(call: TurnToolCall): string {
    const actionName = call.toolName === EXECUTE_ACTION_TOOL ? actionNameOf(call) : null
    return isNil(actionName) ? call.toolName : `${call.toolName} (${actionName})`
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
const EXECUTE_ACTION_TOOL = 'ap_execute_action'
const VALIDATE_FLOW_TOOL = 'ap_validate_flow'
const DELETE_ACTION_PATTERN = /(^|[_\-.])(delete|remove)([_\-.]|$)/i
const MAX_ISSUES = 5
const NOT_DATA_TOOLS = new Set([
    'ap_deep_research',
    'ap_deselect_project',
    'ap_generate_image',
    'ap_read_result',
    'ap_run_task',
    'ap_select_project',
    'ap_set_build_plan',
    'ap_update_thinking_status',
])
const NOT_RUN: CodeCheckResult = { verdict: 'pass', reason: 'No code checks: they run on live cases only' }

export const evalCodeChecks = {
    run,
    declaredProblems,
    notRun: NOT_RUN,
}

type CheckedOutcome = Pick<TurnOutcome, 'toolCalls' | 'cardsShown'>

export type CodeCheckResult = {
    verdict: RunVerdict
    reason: string
}
