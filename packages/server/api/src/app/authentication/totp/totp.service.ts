import { ActivepiecesError, AuthenticationResponse, EnableTotpResponse, ErrorCode, ForcedSetupCompleteResponse, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { userService } from '../../user/user-service'
import { authenticationUtils } from '../authentication-utils'
import { accessTokenManager } from '../lib/access-token-manager'
import { totpUtils } from '../lib/totp-utils'
import { BackupCodeEntry, UserIdentityEntity } from '../user-identity/user-identity-entity'

const userIdentityRepo = repoFactory(UserIdentityEntity)

export const totpService = (log: FastifyBaseLogger) => ({
    async setup({ mfaToken }: { mfaToken: string }): Promise<{ secret: string, otpauthUrl: string, qrCodeDataUrl: string }> {
        const { identityId } = await accessTokenManager(log).verifyMfaChallengeToken({ token: mfaToken })
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_ALREADY_ENABLED, params: {} })
        }
        const { secret, otpauthUrl, qrCodeDataUrl } = await totpUtils.generateSecret({
            email: identity.email,
            issuer: 'Activepieces',
        })
        const encryptedSecret = await totpUtils.encryptSecret({ secret })
        await userIdentityRepo().update(identityId, { totpSecret: encryptedSecret })
        return { secret, otpauthUrl, qrCodeDataUrl }
    },

    async enable({ mfaToken, code }: { mfaToken: string, code: string }): Promise<ForcedSetupCompleteResponse | EnableTotpResponse> {
        const { identityId, platformId, setupRequired } = await accessTokenManager(log).verifyMfaChallengeToken({ token: mfaToken })
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_ALREADY_ENABLED, params: {} })
        }
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
        if (setupRequired) {
            const user = await userService(log).getOneByIdentityAndPlatform({ identityId, platformId })
            if (isNil(user)) {
                throw new ActivepiecesError({ code: ErrorCode.AUTHENTICATION, params: { message: 'User not found' } })
            }
            const authResponse: AuthenticationResponse = await authenticationUtils(log).getProjectAndToken({ userId: user.id, platformId, projectId: null })
            return { ...authResponse, backupCodes: rawCodes }
        }
        return { backupCodes: rawCodes }
    },

    async generateMfaToken({ identityId, platformId }: { identityId: string, platformId: string }): Promise<{ mfaToken: string }> {
        const mfaToken = await accessTokenManager(log).generateMfaChallengeToken({ identityId, platformId })
        return { mfaToken }
    },

    async disable({ identityId, code }: { identityId: string, code: string }): Promise<void> {
        const identity = await userIdentityRepo().findOneByOrFail({ id: identityId })
        if (!identity.totpEnabled) {
            throw new ActivepiecesError({ code: ErrorCode.MFA_NOT_ENABLED, params: {} })
        }
        const verified = await verifyTotpOrBackupCode({ identityId, code })
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
        const verified = await verifyTotpOrBackupCode({ identityId, code })
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

})

async function verifyTotpOrBackupCode({ identityId, code }: { identityId: string, code: string }): Promise<boolean> {
    const repo = repoFactory(UserIdentityEntity)()
    return repo.manager.transaction(async (manager) => {
        const identity = await manager.findOne(UserIdentityEntity, {
            where: { id: identityId },
            lock: { mode: 'pessimistic_write' },
        })
        if (isNil(identity)) {
            return false
        }
        if (!isNil(identity.totpSecret)) {
            const secret = await totpUtils.decryptSecret({ encryptedSecret: identity.totpSecret })
            if (totpUtils.verifyCode({ secret, code })) {
                return true
            }
        }
        const backupCodes = identity.backupCodes ?? []
        for (const entry of backupCodes) {
            if (!entry.used && await totpUtils.verifyBackupCode({ code, hash: entry.hash })) {
                entry.used = true
                await manager.update(UserIdentityEntity, identityId, { backupCodes })
                return true
            }
        }
        return false
    })
}
