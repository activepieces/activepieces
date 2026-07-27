import { z } from 'zod'

export const ChatAutonomyMode = z.enum(['ask_first', 'full_access'])
export type ChatAutonomyMode = z.infer<typeof ChatAutonomyMode>

export const ChatConsentDecision = z.enum(['allow', 'ask', 'deny'])
export type ChatConsentDecision = z.infer<typeof ChatConsentDecision>

export const ChatConsentPolicySettings = z.object({
    fullAccessEnabled: z.boolean().optional(),
    overrides: z.record(z.string(), ChatConsentDecision).optional(),
})
export type ChatConsentPolicySettings = z.infer<typeof ChatConsentPolicySettings>
