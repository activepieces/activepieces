import { AiUsageEvent } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

/**
 * Vendor-agnostic sink for AI usage events. The CE default is a no-op that only logs; an edition
 * (cloud/EE) overrides it via `aiUsageTrackerHooks.set(...)` in `app.ts` to forward the event to a
 * usage-billing vendor. Keeping the vendor behind this hook means billing logic can be iterated
 * server-side without touching the version-pinned producer (the worker AI service).
 *
 * Billing classification, if ever added, is decided here from worker-derived state — never from the
 * event's `actionName`/`origin`, which are sandbox-supplied and untrusted.
 */
export const aiUsageTrackerHooks = hooksFactory.create<AiUsageTracker>((log) => ({
    track: async ({ platformId, projectId, event }: AiUsageTrackParams): Promise<void> => {
        log.debug({
            platformId,
            projectId,
            idempotencyKey: event.idempotencyKey,
            source: event.source,
            modality: event.modality,
            provider: event.provider,
            model: event.model,
            toolCallCount: event.toolCalls?.length ?? 0,
            imageCount: event.imageCount,
        }, '[aiUsageTracker] received AI usage event (no-op tracker)')
    },
}))

export type AiUsageTrackParams = {
    platformId: string
    projectId: string
    event: AiUsageEvent
}

export type AiUsageTracker = {
    track(params: AiUsageTrackParams): Promise<void>
}
