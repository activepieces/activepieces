import { z } from 'zod'
import { AuthenticationResponse } from './authentication-response'

export const SetupTotpResponse = z.object({
    secret: z.string(),
    otpauthUrl: z.string(),
    qrCodeDataUrl: z.string(),
})
export type SetupTotpResponse = z.infer<typeof SetupTotpResponse>

export const EnableTotpRequest = z.object({
    code: z.string(),
})
export type EnableTotpRequest = z.infer<typeof EnableTotpRequest>

export const EnableTotpResponse = z.object({
    backupCodes: z.array(z.string()),
})
export type EnableTotpResponse = z.infer<typeof EnableTotpResponse>

export const DisableTotpRequest = z.object({
    code: z.string(),
})
export type DisableTotpRequest = z.infer<typeof DisableTotpRequest>

export const VerifyTotpRequest = z.object({
    mfaToken: z.string(),
    code: z.string(),
})
export type VerifyTotpRequest = z.infer<typeof VerifyTotpRequest>

export const TotpStatusResponse = z.object({
    enabled: z.boolean(),
    backupCodesRemaining: z.number(),
})
export type TotpStatusResponse = z.infer<typeof TotpStatusResponse>

export const RegenerateBackupCodesRequest = z.object({
    code: z.string(),
})
export type RegenerateBackupCodesRequest = z.infer<typeof RegenerateBackupCodesRequest>

export const MfaChallengeResponse = z.object({
    mfaRequired: z.literal(true),
    mfaToken: z.string(),
    setupRequired: z.boolean().optional(),
})
export type MfaChallengeResponse = z.infer<typeof MfaChallengeResponse>

export const ForcedSetupCompleteResponse = AuthenticationResponse.extend({
    backupCodes: z.array(z.string()),
})
export type ForcedSetupCompleteResponse = z.infer<typeof ForcedSetupCompleteResponse>

export const ForcedSetupInitRequest = z.object({
    mfaToken: z.string(),
})
export type ForcedSetupInitRequest = z.infer<typeof ForcedSetupInitRequest>

export const ForcedSetupCompleteRequest = z.object({
    mfaToken: z.string(),
    code: z.string(),
})
export type ForcedSetupCompleteRequest = z.infer<typeof ForcedSetupCompleteRequest>

export const SignInResponse = z.union([AuthenticationResponse, MfaChallengeResponse])
export type SignInResponse = z.infer<typeof SignInResponse>
