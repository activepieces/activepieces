import { z } from 'zod'

export const MfaChallengeResponse = z.object({
    mfaRequired: z.literal(true),
    setupRequired: z.boolean().optional(),
    enforced: z.boolean().optional(),
})
export type MfaChallengeResponse = z.infer<typeof MfaChallengeResponse>

export function isMfaChallenge(r: unknown): r is MfaChallengeResponse {
    return typeof r === 'object' && r !== null && (r as Record<string, unknown>)['mfaRequired'] === true
}
