import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { autoConsent, AutoConsentJudge, AutoConsentJudgeRequest, AutoConsentVerdict } from '@activepieces/shared'
import { generateText, LanguageModel } from 'ai'

const JUDGE_TIMEOUT_MS = 12_000
const JUDGE_MAX_OUTPUT_TOKENS = 300

function memoKeyOf(request: AutoConsentJudgeRequest): string {
    return JSON.stringify([request.toolName, request.actionLabel, request.kinds, request.input, request.batchSummary ?? null, request.tainted === true])
}

function createAutoConsentJudge({ model, userRequest, onVerdict, log }: {
    model: LanguageModel
    userRequest: string
    onVerdict?: (params: { request: AutoConsentJudgeRequest, verdict: AutoConsentVerdict }) => Promise<void>
    log?: { info?: (obj: Record<string, unknown>, msg: string) => void, warn: (obj: Record<string, unknown>, msg: string) => void }
}): AutoConsentJudge {
    const memo = new Map<string, AutoConsentVerdict>()
    const fenceNonce = apId()
    return async (request) => {
        const key = memoKeyOf(request)
        const cached = memo.get(key)
        if (!isNil(cached)) {
            return cached
        }
        const prompt = autoConsent.buildJudgePrompt({
            userRequest,
            toolName: request.toolName,
            actionLabel: request.actionLabel,
            kinds: request.kinds,
            input: request.input,
            batchSummary: request.batchSummary,
            tainted: request.tainted,
            fenceNonce,
        })
        const startedAt = Date.now()
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), JUDGE_TIMEOUT_MS)
        const { data: result, error } = await tryCatch(() => generateText({
            model,
            prompt,
            maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
            abortSignal: abortController.signal,
        }))
        clearTimeout(timeoutId)
        const verdict: AutoConsentVerdict = isNil(error) && !isNil(result)
            ? autoConsent.parseJudgeVerdict(result.text)
            : { decision: 'ask', reason: autoConsent.FALLBACK_ASK_REASON }
        if (!isNil(error)) {
            log?.warn({ error, tool: { name: request.toolName }, judge: { durationMs: Date.now() - startedAt } }, 'Auto-consent judge call failed, falling back to ask')
        }
        else {
            log?.info?.({ tool: { name: request.toolName }, judge: { decision: verdict.decision, reason: verdict.reason, durationMs: Date.now() - startedAt } }, 'Auto-consent judge ruled')
        }
        memo.set(key, verdict)
        if (verdict.decision === 'run' && !isNil(onVerdict)) {
            await tryCatch(() => onVerdict({ request, verdict }))
        }
        return verdict
    }
}

export const autoConsentJudge = {
    createAutoConsentJudge,
}
