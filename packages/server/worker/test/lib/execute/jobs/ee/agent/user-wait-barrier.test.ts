import { tool, ToolExecutionOptions } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { wrapToolsWithUserWaitBarrier } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/user-wait-barrier'

const OPTIONS: ToolExecutionOptions<undefined> = { toolCallId: 'call', messages: [], context: undefined }

function deferred(): { promise: Promise<string>, resolve: (value: string) => void } {
    let resolve: (value: string) => void = () => undefined
    const promise = new Promise<string>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

describe('wrapToolsWithUserWaitBarrier', () => {
    it('holds a flow edit until a permission gate in the same turn is answered', async () => {
        const approval = deferred()
        const order: string[] = []
        const tools = wrapToolsWithUserWaitBarrier({ tools: {
            ap_remember: tool({ inputSchema: z.object({}), execute: async () => {
                const answer = await approval.promise
                order.push(`remember:${answer}`)
                return answer
            } }),
            ap_update_step: tool({ inputSchema: z.object({}), execute: async () => {
                order.push('update_step')
                return 'updated'
            } }),
        } })

        const remember = tools.ap_remember.execute?.({}, OPTIONS)
        const update = tools.ap_update_step.execute?.({}, OPTIONS)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(order).toEqual([])

        approval.resolve('approved')
        await Promise.all([remember, update])
        expect(order).toEqual(['remember:approved', 'update_step'])
    })

    it('hands an edit queued behind a question back to the agent once the user answers', async () => {
        const answer = deferred()
        let ran = false
        const tools = wrapToolsWithUserWaitBarrier({ tools: {
            ap_show_questions: tool({ inputSchema: z.object({}), execute: async () => answer.promise }),
            ap_update_step: tool({ inputSchema: z.object({}), execute: async () => {
                ran = true
                return 'updated'
            } }),
        } })

        const question = tools.ap_show_questions.execute?.({}, OPTIONS)
        const update = tools.ap_update_step.execute?.({}, OPTIONS)
        answer.resolve('weekly')
        const [, updateResult] = await Promise.all([question, update])

        expect(ran).toBe(false)
        expect(JSON.stringify(updateResult)).toContain('Redo this change')
    })

    it('lets edits run in the next step after the question was answered', async () => {
        const tools = wrapToolsWithUserWaitBarrier({ tools: {
            ap_show_questions: tool({ inputSchema: z.object({}), execute: async () => 'weekly' }),
            ap_update_step: tool({ inputSchema: z.object({}), execute: async () => 'updated' }),
        } })

        await tools.ap_show_questions.execute?.({}, OPTIONS)

        expect(await tools.ap_update_step.execute?.({}, OPTIONS)).toBe('updated')
    })

    it('runs tools normally when nothing waits for the user', async () => {
        const tools = wrapToolsWithUserWaitBarrier({ tools: {
            ap_update_step: tool({ inputSchema: z.object({}), execute: async () => 'updated' }),
        } })

        expect(await tools.ap_update_step.execute?.({}, OPTIONS)).toBe('updated')
    })
})
