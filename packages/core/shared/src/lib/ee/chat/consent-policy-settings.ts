import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { PlatformRole } from '../../core/user/user'

function effectiveFullAccessAllowedFor({ settings }: { settings: ChatConsentPolicySettings | null | undefined }): ChatFullAccessAllowedFor {
    if (!isNil(settings?.fullAccessAllowedFor)) {
        return settings.fullAccessAllowedFor
    }
    return settings?.fullAccessEnabled === false ? 'nobody' : 'everyone'
}

function fullAccessPermitted({ settings, platformRole }: { settings: ChatConsentPolicySettings | null | undefined, platformRole: string }): boolean {
    const allowedFor = effectiveFullAccessAllowedFor({ settings })
    if (allowedFor === 'nobody') {
        return false
    }
    if (allowedFor === 'admins_only') {
        return platformRole === PlatformRole.ADMIN
    }
    return true
}

export const chatConsentPolicy = {
    effectiveFullAccessAllowedFor,
    fullAccessPermitted,
}

export const ChatAutonomyMode = z.enum(['ask_first', 'auto', 'full_access'])
export type ChatAutonomyMode = z.infer<typeof ChatAutonomyMode>

export const ChatConsentDecision = z.enum(['allow', 'ask', 'deny'])
export type ChatConsentDecision = z.infer<typeof ChatConsentDecision>

export const ChatFullAccessAllowedFor = z.enum(['everyone', 'admins_only', 'nobody'])
export type ChatFullAccessAllowedFor = z.infer<typeof ChatFullAccessAllowedFor>

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
    fullAccessAllowedFor: ChatFullAccessAllowedFor.optional(),
    overrides: z.partialRecord(ChatConsentOverridableKind, ChatConsentDecision).optional(),
})
export type ChatConsentPolicySettings = z.infer<typeof ChatConsentPolicySettings>
