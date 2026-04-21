import { z } from 'zod'

function isMfaChallenge(r: unknown): r is MfaChallengeResponse {
    return typeof r === 'object' && r !== null && (r as Record<string, unknown>)['mfaRequired'] === true
}

export const MfaChallengeResponse = z.object({
    mfaRequired: z.literal(true),
    setupRequired: z.boolean().optional(),
    enforced: z.boolean().optional(),
})
export type MfaChallengeResponse = z.infer<typeof MfaChallengeResponse>

export const RATE_LIMIT_WINDOW_SECONDS = 30

export { isMfaChallenge }
