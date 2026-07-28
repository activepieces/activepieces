import { z } from 'zod'

export const ChatAutonomyMode = z.enum(['ask_first', 'full_access'])
export type ChatAutonomyMode = z.infer<typeof ChatAutonomyMode>

export const ChatConsentDecision = z.enum(['allow', 'ask', 'deny'])
export type ChatConsentDecision = z.infer<typeof ChatConsentDecision>

export const ChatConsentOverridableKind = z.enum([
    'internal_destructive',
    'external_write',
    'outward_send',
    'destructive',
    'financial',
    'input_dependent',
    'unknown',
])
export type ChatConsentOverridableKind = z.infer<typeof ChatConsentOverridableKind>

export const ChatConsentPolicySettings = z.object({
    fullAccessEnabled: z.boolean().optional(),
    overrides: z.partialRecord(ChatConsentOverridableKind, ChatConsentDecision).optional(),
})
export type ChatConsentPolicySettings = z.infer<typeof ChatConsentPolicySettings>
