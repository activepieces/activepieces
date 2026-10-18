import { partition } from '@activepieces/core-utils'
import { ToolExecutionOptions, ToolSet } from 'ai'
import { toolHasExecute } from './tool-primitives'

export function wrapToolsWithUserWaitBarrier({ tools }: { tools: ToolSet }): ToolSet {
    const barrier = createBarrier()
    return Object.fromEntries(Object.entries(tools).map(([toolName, tool]) => {
        if (!toolHasExecute(tool) || NEVER_HELD_TOOLS.has(toolName)) {
            return [toolName, tool]
        }
        const originalExecute = tool.execute.bind(tool)
        const claimKind = ASKS_USER_TOOLS.has(toolName) ? 'ask' : MAY_WAIT_FOR_USER_TOOLS.has(toolName) ? 'gate' : null
        const execute = async (args: unknown, options?: ToolExecutionOptions<undefined>) => {
            if (claimKind !== 'ask') {
                const until = claimKind === 'gate' ? 'questions-answered' : 'all-answered'
                if (!barrier.isAnswered(until) && await barrier.waitForUser({ until }) === 'after-question') {
                    return { content: [{ type: 'text', text: HELD_BEHIND_QUESTION_MESSAGE }] }
                }
            }
            if (claimKind === null) {
                return originalExecute(args, options)
            }
            const release = barrier.claim(claimKind)
            try {
                return await originalExecute(args, options)
            }
            finally {
                release()
            }
        }
        return [toolName, Object.assign({}, tool, { execute })]
    }))
}

function createBarrier(): Barrier {
    const openClaims = { ask: 0, gate: 0 }
    let waiters: Waiter[] = []
    const isAnswered = (until: WaitUntil) => until === 'questions-answered' ? openClaims.ask === 0 : openClaims.ask + openClaims.gate === 0
    return {
        isAnswered,
        claim: (kind) => {
            openClaims[kind] += 1
            if (kind === 'ask') {
                waiters = waiters.map((waiter) => ({ ...waiter, sawQuestion: true }))
            }
            let released = false
            return () => {
                if (released) {
                    return
                }
                released = true
                openClaims[kind] -= 1
                const [ready, stillWaiting] = partition(waiters, (waiter) => isAnswered(waiter.until))
                waiters = stillWaiting
                ready.forEach((waiter) => waiter.wake(waiter.sawQuestion ? 'after-question' : 'after-approval'))
            }
        },
        waitForUser: ({ until }) => new Promise((wake) => {
            waiters = [...waiters, { until, sawQuestion: openClaims.ask > 0, wake }]
        }),
    }
}

const ASKS_USER_TOOLS = new Set([
    'ap_show_questions',
    'ap_show_connection_required',
    'ap_show_connection_picker',
    'ap_show_project_picker',
    'ap_show_mcp_reconnect',
])

const MAY_WAIT_FOR_USER_TOOLS = new Set([
    'ap_test_flow',
    'ap_delete_records',
    'ap_delete_table',
    'ap_delete_flow',
    'ap_manage_fields',
    'ap_send_email',
    'ap_execute_action',
    'ap_remember',
    'ap_add_agent_tool',
    'ap_remove_agent_tool',
    'ap_update_agent',
    'ap_create_agent',
])

const NEVER_HELD_TOOLS = new Set([
    'ap_update_thinking_status',
    'ap_set_build_plan',
    'ap_show_quick_replies',
    'ap_show_showcase',
])

const HELD_BEHIND_QUESTION_MESSAGE = 'Not run: you asked the user a question in the same step. Their answer is in that question\'s result now. Redo this change if it still fits the answer.'

type WaitResult = 'after-question' | 'after-approval'

type WaitUntil = 'questions-answered' | 'all-answered'

type Waiter = {
    until: WaitUntil
    sawQuestion: boolean
    wake: (result: WaitResult) => void
}

type Barrier = {
    isAnswered: (until: WaitUntil) => boolean
    claim: (kind: 'ask' | 'gate') => () => void
    waitForUser: (params: { until: WaitUntil }) => Promise<WaitResult>
}
