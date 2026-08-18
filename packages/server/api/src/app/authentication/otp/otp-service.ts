import { apId, isNil, PlatformId } from '@activepieces/core-utils'
import { OtpModel, OtpState, OtpType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock, distributedStore } from '../../database/redis-connections'
import { emailService } from '../../ee/helper/email/email-service'
import { encryptUtils } from '../../helper/encryption'
import { userIdentityService } from '../user-identity/user-identity-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'

const OTP_EXPIRATION_MS: Record<OtpType, number> = {
    [OtpType.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000,
    [OtpType.PASSWORD_RESET]: 10 * 60 * 1000,
    [OtpType.EMAIL_LOGIN]: 10 * 60 * 1000,
}
const HASHED_OTP_VERSION = 1
const MAX_ATTEMPTS = 5
const MAX_ATTEMPTS_PER_IDENTITY = 10
const IDENTITY_BUDGET_WINDOW_SECONDS = 60 * 60

const repo = repoFactory(OtpEntity)

export const otpService = (log: FastifyBaseLogger) => ({
    async createAndSend({
        platformId,
        email,
        type,
    }: CreateParams): Promise<void> {
        const userIdentity = await userIdentityService(log).getIdentityByEmail(email)
        if (!userIdentity) {
            return
        }
        const identityId = userIdentity.id
        const code = await distributedLock(log).runExclusive({
            key: confirmLockKey({ identityId, type }),
            timeoutInSeconds: 15,
            fn: async () => {
                const existingOtp = await repo().findOneBy({ identityId, type })
                const otpIsInFlight = !isNil(existingOtp) && existingOtp.state === OtpState.PENDING && !otpIsExpired(existingOtp)
                const codeInFlight = otpIsInFlight ? await cachedCode({ identityId, type }) : null
                if (!isNil(codeInFlight)) {
                    return codeInFlight
                }
                const freshCode = otpGenerator.generate({ type })
                const newOtp: Omit<OtpModel, 'created'> = {
                    id: apId(),
                    updated: dayjs().toISOString(),
                    type,
                    identityId,
                    value: await encryptUtils.hmacString(freshCode),
                    state: OtpState.PENDING,
                    attempts: 0,
                    version: HASHED_OTP_VERSION,
                }
                await repo().upsert(newOtp, ['identityId', 'type'])
                await cacheCode({ identityId, type, code: freshCode })
                return freshCode
            },
        })
        await emailService(log).sendOtp({
            platformId,
            userIdentity,
            otp: code,
            type,
        })
    },

    async confirm({ identityId, type, value }: ConfirmParams): Promise<boolean> {
        return distributedLock(log).runExclusive({
            key: confirmLockKey({ identityId, type }),
            timeoutInSeconds: 15,
            fn: async () => {
                const spentOnIdentity = await guessesSpentOnIdentity({ identityId, type })
                if (spentOnIdentity >= MAX_ATTEMPTS_PER_IDENTITY) {
                    log.warn({ identityId, type }, '[otpService#confirm] identity guess budget exhausted, refusing')
                    return false
                }
                const otp = await repo().findOneBy({ identityId, type })
                if (isNil(otp)) {
                    return false
                }
                if (otp.attempts >= MAX_ATTEMPTS) {
                    await discard({ otp, identityId, type, log })
                    return false
                }
                if (otpIsExpired(otp)) {
                    await discard({ otp, identityId, type, log })
                    return false
                }
                const otpIsPending = otp.state === OtpState.PENDING
                const otpMatches = encryptUtils.digestsMatch(otp.value, await comparableValue({ otp, value }))
                if (otpMatches && otpIsPending) {
                    await repo().delete({ id: otp.id })
                    await forgetCachedCode({ identityId, type })
                    await clearIdentityBudget({ identityId, type })
                    return true
                }
                await countAttempt(otp.id)
                await countGuessOnIdentity({ identityId, type, spent: spentOnIdentity })
                if (otp.attempts + 1 >= MAX_ATTEMPTS) {
                    await discard({ otp, identityId, type, log })
                }
                return false
            },
        })
    },
})

async function comparableValue({ otp, value }: ComparableValueParams): Promise<string> {
    const writtenBeforeHashing = otp.version < HASHED_OTP_VERSION
    return writtenBeforeHashing ? value : encryptUtils.hmacString(value)
}

async function countAttempt(otpId: string): Promise<void> {
    await repo().query('UPDATE "otp" SET "attempts" = "attempts" + 1 WHERE "id" = $1', [otpId])
}

async function discard({ otp, identityId, type, log }: DiscardParams): Promise<void> {
    await repo().delete({ id: otp.id })
    await forgetCachedCode({ identityId, type })
    log.warn({ identityId, type }, '[otpService#confirm] credential discarded')
}

function confirmLockKey({ identityId, type }: IdentityBudgetParams): string {
    return `otp-confirm-${identityId}-${type}`
}

function cachedCodeKey({ identityId, type }: IdentityBudgetParams): string {
    return `otp-pending-code:${identityId}:${type}`
}

async function cacheCode({ identityId, type, code }: CacheCodeParams): Promise<void> {
    const ttlSeconds = Math.ceil(OTP_EXPIRATION_MS[type] / 1000)
    await distributedStore.put(cachedCodeKey({ identityId, type }), code, ttlSeconds)
}

async function cachedCode({ identityId, type }: IdentityBudgetParams): Promise<string | null> {
    return distributedStore.get<string>(cachedCodeKey({ identityId, type }))
}

async function forgetCachedCode({ identityId, type }: IdentityBudgetParams): Promise<void> {
    await distributedStore.delete(cachedCodeKey({ identityId, type }))
}

function otpIsExpired(otp: OtpModel): boolean {
    return dayjs().diff(otp.updated, 'milliseconds') >= OTP_EXPIRATION_MS[otp.type]
}

function identityBudgetKey({ identityId, type }: IdentityBudgetParams): string {
    return `otp-guess-budget:${identityId}:${type}`
}

async function guessesSpentOnIdentity({ identityId, type }: IdentityBudgetParams): Promise<number> {
    const budget = await distributedStore.get<IdentityGuessBudget>(identityBudgetKey({ identityId, type }))
    return isNil(budget) ? 0 : budget.count
}

async function countGuessOnIdentity({ identityId, type, spent }: CountGuessOnIdentityParams): Promise<void> {
    const key = identityBudgetKey({ identityId, type })
    const existing = await distributedStore.get<IdentityGuessBudget>(key)
    const windowStartedAt = isNil(existing) ? Date.now() : existing.windowStartedAt
    const elapsedSeconds = Math.floor((Date.now() - windowStartedAt) / 1000)
    const remainingSeconds = Math.max(IDENTITY_BUDGET_WINDOW_SECONDS - elapsedSeconds, 1)
    await distributedStore.put(key, { count: spent + 1, windowStartedAt }, remainingSeconds)
}

async function clearIdentityBudget({ identityId, type }: IdentityBudgetParams): Promise<void> {
    await distributedStore.delete(identityBudgetKey({ identityId, type }))
}

type CreateParams = {
    platformId: PlatformId | null
    email: string
    type: OtpType
}

type IdentityBudgetParams = {
    identityId: string
    type: OtpType
}

type CountGuessOnIdentityParams = IdentityBudgetParams & {
    spent: number
}

type CacheCodeParams = IdentityBudgetParams & {
    code: string
}

type ComparableValueParams = {
    otp: OtpModel
    value: string
}

type IdentityGuessBudget = {
    count: number
    windowStartedAt: number
}

type DiscardParams = {
    otp: OtpModel
    identityId: string
    type: OtpType
    log: FastifyBaseLogger
}

type ConfirmParams = {
    identityId: string
    type: OtpType
    value: string
}
