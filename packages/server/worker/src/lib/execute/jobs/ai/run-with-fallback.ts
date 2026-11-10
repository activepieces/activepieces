import { isFallbackWorthy, ProviderOutcomeSignal } from '@activepieces/core-utils'
import { aiProviderSignal, ApLogger } from '@activepieces/server-utils'
import { AiModelCandidate } from '@activepieces/shared'

export async function runWithFallback<T>({ candidates, tierName, log, report, attempt }: {
    candidates: AiModelCandidate[]
    tierName: string
    log: ApLogger
    report: (outcome: { candidate: AiModelCandidate, signal: ProviderOutcomeSignal }) => Promise<void>
    attempt: (run: CandidateRun) => Promise<T>
}): Promise<T> {
    let lastError: unknown
    for (const [index, candidate] of candidates.entries()) {
        const isLast = index === candidates.length - 1
        let stepFinished = false
        const outcome = await settle(() => attempt({
            candidate,
            maxRetries: isLast ? undefined : RETRIES_BEFORE_FALLBACK,
            onStepFinish: () => {
                stepFinished = true
            },
        }))
        if (outcome.ok) {
            if (candidate.status !== 'active') {
                await report({ candidate, signal: { statusCode: 200 } })
            }
            if (index > 0) {
                log.info({ platformTier: { name: tierName }, candidateIndex: index, model: { id: candidate.modelId } }, '[runWithFallback] A fallback model answered')
            }
            return outcome.value
        }
        const error = outcome.error
        lastError = error
        const signal = aiProviderSignal.fromError(error)
        if (signal.fromProvider === true) {
            await report({ candidate, signal })
        }
        if (stepFinished || !isFallbackWorthy(signal) || candidates.length === 1) {
            throw error
        }
        if (!isLast) {
            log.warn({ platformTier: { name: tierName }, candidateIndex: index, model: { id: candidate.modelId }, statusCode: signal.statusCode }, '[runWithFallback] Model failed, trying the next one in the tier')
        }
    }
    const modelIds = candidates.map((candidate) => candidate.modelId).join(', ')
    throw new Error(`All ${candidates.length} models in tier ${tierName} failed (${modelIds}). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

async function settle<T>(run: () => Promise<T>): Promise<Settled<T>> {
    try {
        return { ok: true, value: await run() }
    }
    catch (error) {
        return { ok: false, error }
    }
}

const RETRIES_BEFORE_FALLBACK = 1

type Settled<T> = { ok: true, value: T } | { ok: false, error: unknown }

export type CandidateRun = {
    candidate: AiModelCandidate
    maxRetries: number | undefined
    onStepFinish: () => void
}
