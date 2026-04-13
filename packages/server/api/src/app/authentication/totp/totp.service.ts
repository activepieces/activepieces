import { ActivepiecesError, AuthenticationResponse, ErrorCode, ForcedSetupCompleteResponse, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { userService } from '../../user/user-service'
import { authenticationUtils } from '../authentication-utils'
import { accessTokenManager } from '../lib/access-token-manager'
import { totpUtils } from '../lib/totp-utils'
import { BackupCodeEntry, UserIdentityEntity, UserIdentitySchema } from '../user-identity/user-identity-entity'

const userIdentityRepo = repoFactory(UserIdentityEntity)

export const totpService = (log: FastifyBaseLogger) => ({
    async setup({ identityId }: { identityId: string }): Promise<{ secret: string, otpauthUrl: string, qrCodeDataUrl: string }> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        const { secret, otpauthUrl, qrCodeDataUrl } = await totpUtils.generateSecret({
            email: identity.email,
            issuer: 'Activepieces',
        })
        const encryptedSecret = await totpUtils.encryptSecret({ secret })
        await userIdentityRepo().update(identityId, { totpSecret: encryptedSecret })
        return { secret, otpauthUrl, qrCodeDataUrl }
    },

    async enable({ identityId, code }: { identityId: string, code: string }): Promise<{ backupCodes: string[] }> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_ALREADY_ENABLED, params: {} })
        }
        if (isNil(identity.totpSecret)) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const secret = await totpUtils.decryptSecret({ encryptedSecret: identity.totpSecret })
        const valid = totpUtils.verifyCode({ secret, code })
        if (!valid) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_2FA_CODE, params: {} })
        }
        const rawCodes = totpUtils.generateBackupCodes()
        const backupCodes: BackupCodeEntry[] = await Promise.all(
            rawCodes.map(async (c) => ({ hash: await totpUtils.hashBackupCode({ code: c }), used: false })),
        )
        await userIdentityRepo().update(identityId, { totpEnabled: true, backupCodes })
        return { backupCodes: rawCodes }
    },

    async disable({ identityId, code }: { identityId: string, code: string }): Promise<void> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (!identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const verified = await verifyTotpOrBackupCode({ identity, code })
        if (!verified) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_2FA_CODE, params: {} })
        }
        await userIdentityRepo().update(identityId, { totpEnabled: false, totpSecret: null, backupCodes: null })
    },

    async verify({ mfaToken, code }: { mfaToken: string, code: string }): Promise<ReturnType<ReturnType<typeof authenticationUtils>['getProjectAndToken']>> {
        const { identityId, platformId } = await accessTokenManager(log).verifyMfaChallengeToken({ token: mfaToken })
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (!identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const verified = await verifyTotpOrBackupCode({ identity, code })
        if (!verified) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_2FA_CODE, params: {} })
        }
        const user = await userService(log).getOneByIdentityAndPlatform({ identityId, platformId })
        if (isNil(user)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHENTICATION, params: { message: 'User not found' } })
        }
        return authenticationUtils(log).getProjectAndToken({ userId: user.id, platformId, projectId: null })
    },

    async getStatus({ identityId }: { identityId: string }): Promise<{ enabled: boolean, backupCodesRemaining: number }> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        const backupCodesRemaining = (identity.backupCodes ?? []).filter((c) => !c.used).length
        return { enabled: identity.totpEnabled, backupCodesRemaining }
    },

    async regenerateBackupCodes({ identityId, code }: { identityId: string, code: string }): Promise<{ backupCodes: string[] }> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (!identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        if (isNil(identity.totpSecret)) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const secret = await totpUtils.decryptSecret({ encryptedSecret: identity.totpSecret })
        const valid = totpUtils.verifyCode({ secret, code })
        if (!valid) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_2FA_CODE, params: {} })
        }
        const rawCodes = totpUtils.generateBackupCodes()
        const backupCodes: BackupCodeEntry[] = await Promise.all(
            rawCodes.map(async (c) => ({ hash: await totpUtils.hashBackupCode({ code: c }), used: false })),
        )
        await userIdentityRepo().update(identityId, { backupCodes })
        return { backupCodes: rawCodes }
    },

    async forcedSetupInit({ mfaToken }: { mfaToken: string }): Promise<{ secret: string, otpauthUrl: string, qrCodeDataUrl: string }> {
        const { identityId } = await accessTokenManager(log).verifyMfaChallengeToken({ token: mfaToken })
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        const { secret, otpauthUrl, qrCodeDataUrl } = await totpUtils.generateSecret({
            email: identity.email,
            issuer: 'Activepieces',
        })
        const encryptedSecret = await totpUtils.encryptSecret({ secret })
        await userIdentityRepo().update(identityId, { totpSecret: encryptedSecret })
        return { secret, otpauthUrl, qrCodeDataUrl }
    },

    async forcedSetupComplete({ mfaToken, code }: { mfaToken: string, code: string }): Promise<ForcedSetupCompleteResponse> {
        const { identityId, platformId } = await accessTokenManager(log).verifyMfaChallengeToken({ token: mfaToken })
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (isNil(identity.totpSecret)) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const secret = await totpUtils.decryptSecret({ encryptedSecret: identity.totpSecret })
        if (!totpUtils.verifyCode({ secret, code })) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_2FA_CODE, params: {} })
        }
        const rawCodes = totpUtils.generateBackupCodes()
        const backupCodes: BackupCodeEntry[] = await Promise.all(
            rawCodes.map(async (c) => ({ hash: await totpUtils.hashBackupCode({ code: c }), used: false })),
        )
        await userIdentityRepo().update(identityId, { totpEnabled: true, backupCodes })
        const user = await userService(log).getOneByIdentityAndPlatform({ identityId, platformId })
        if (isNil(user)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHENTICATION, params: { message: 'User not found' } })
        }
        const authResponse: AuthenticationResponse = await authenticationUtils(log).getProjectAndToken({ userId: user.id, platformId, projectId: null })
        return { ...authResponse, backupCodes: rawCodes }
    },
})

async function verifyTotpOrBackupCode({ identity, code }: { identity: UserIdentitySchema, code: string }): Promise<boolean> {
    if (!isNil(identity.totpSecret)) {
        const secret = await totpUtils.decryptSecret({ encryptedSecret: identity.totpSecret })
        if (totpUtils.verifyCode({ secret, code })) {
            return true
        }
    }
    for (const entry of (identity.backupCodes ?? [])) {
        if (!entry.used && await totpUtils.verifyBackupCode({ code, hash: entry.hash })) {
            entry.used = true
            await repoFactory(UserIdentityEntity)().update(identity.id, { backupCodes: identity.backupCodes })
            return true
        }
    }
    return false
}
