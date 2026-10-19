import { isNil, tryCatch } from '@activepieces/core-utils'
import { ActionPreviewEvent, ActionReceiptEvent, AgentEventType, BuildPlanEvent, FileProducedEvent, ImageGeneratedEvent, SendAgentEventRequest, SubagentProgressEvent, ToolProgressEvent } from '@activepieces/shared'
import { taskContext } from './task-context'
import { AgentEventEmitter } from './tool-primitives'

export function createEventEmitter({ sendEvent, userId, conversationId, log }: {
    sendEvent: (input: SendAgentEventRequest) => Promise<void>
    userId: string
    conversationId: string
    log?: { debug?: (obj: Record<string, unknown>, msg: string) => void, warn: (obj: Record<string, unknown>, msg: string) => void }
}): AgentEventEmitter {
    const sendWithRetry = async ({ event, maxAttempts }: { event: SendAgentEventRequest['event'], maxAttempts: number }) => {
        log?.debug?.({ event: { type: event.type } }, 'Chat event emitted')
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const { error } = await tryCatch(() => sendEvent({ userId, conversationId, event }))
            if (!error) return
            if (attempt === maxAttempts) {
                log?.warn({ error, attempt, eventType: event.type }, 'Event delivery failed after retries')
                return
            }
            const delayMs = attempt === 1 ? 200 : 1_000
            await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
    }

    return {
        emitToolProgress(data: ToolProgressEvent): void {
            void sendWithRetry({
                event: { type: AgentEventType.TOOL_PROGRESS, data },
                maxAttempts: 2,
            })
        },
        emitActionPreview(data: ActionPreviewEvent): void {
            const taskTitle = taskContext.currentTitle()
            void sendWithRetry({
                event: { type: AgentEventType.ACTION_PREVIEW, data: isNil(taskTitle) ? data : { ...data, taskTitle } },
                maxAttempts: 3,
            })
        },
        emitActionReceipt(data: ActionReceiptEvent): void {
            void sendWithRetry({
                event: { type: AgentEventType.ACTION_RECEIPT, data },
                maxAttempts: 2,
            })
        },
        emitImageGenerated(data: ImageGeneratedEvent): void {
            void sendWithRetry({
                event: { type: AgentEventType.IMAGE, data },
                maxAttempts: 2,
            })
        },
        emitFileProduced(data: FileProducedEvent): void {
            void sendWithRetry({
                event: { type: AgentEventType.FILE, data },
                maxAttempts: 2,
            })
        },
        emitBuildPlan(data: BuildPlanEvent): void {
            void sendWithRetry({
                event: { type: AgentEventType.BUILD_PLAN, data },
                maxAttempts: 2,
            })
        },
        emitSubagentProgress(data: SubagentProgressEvent): void {
            sendWithRetry({
                event: { type: AgentEventType.SUBAGENT_PROGRESS, data },
                maxAttempts: 2,
            }).catch(() => undefined)
        },
    }
}

// On a gate TIMEOUT (user away, not a decline) resume with guidance instead of a "cancelled" message,
// so the model skips an optional step or stops for a required one — never mistaking silence for consent.
