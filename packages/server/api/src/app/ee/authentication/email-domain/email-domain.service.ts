import { resolveTxt } from 'dns/promises'
import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, isNil, PlatformId, spreadIfDefined, tryCatch, unique, UserId } from '@activepieces/core-utils'
import { ApplicationEventName, AuthenticationDomainEvent, EmailDomain, EmailDomainWithUsage, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, Not } from 'typeorm'
import { z } from 'zod'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { isUniqueViolation } from '../../../core/db/unique-violation'
import { platformSideEffects } from '../../../platform/platform-side-effects'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { EmailDomainEntity } from './email-domain.entity'

export const emailDomainRepo = repoFactory(EmailDomainEntity)

export const emailDomainService = (log: FastifyBaseLogger) => ({
    async list({ platformId }: ListParams): Promise<EmailDomainWithUsage[]> {
        const domains = await emailDomainRepo().find({ where: { platformId }, order: { created: 'ASC' } })
        const peopleCounts = await countPeopleByDomain({ platformId, domains: domains.map((emailDomain) => emailDomain.domain) })
        return domains.map((emailDomain) => ({
            ...emailDomain,
            verificationRecordName: toVerificationRecordName(emailDomain.domain),
            peopleCount: peopleCounts.get(emailDomain.domain) ?? 0,
        }))
    },
    async listVerifiedDomains({ platformId }: ListParams): Promise<string[]> {
        const verified = await emailDomainRepo().find({
            where: { platformId, verificationStatus: SsoDomainVerificationStatus.VERIFIED },
            select: { domain: true },
        })
        return verified.map((emailDomain) => emailDomain.domain)
    },
    async add({ platformId, domain, userId, ip }: AddParams): Promise<EmailDomain> {
        const added = await replaceDomain({ log, platformId, removedId: null, addedDomain: domain, userId, ip })
        assertNotNullOrUndefined(added, 'added')
        return added
    },
    async verify({ platformId, id, userId, ip }: DomainParams): Promise<EmailDomain> {
        const emailDomain = await getOneOrThrow({ platformId, id })
        if (emailDomain.verificationStatus === SsoDomainVerificationStatus.VERIFIED) {
            return emailDomain
        }
        const matched = await txtRecordMatches({ name: toVerificationRecordName(emailDomain.domain), expected: emailDomain.verificationRecordValue, log })
        if (!matched) {
            return emailDomain
        }
        const multipleDomainsAllowed = await hasMultipleDomainsFlag({ platformId, log })
        const verifiedByThisCall = await platformService(log).runWithPlatformSettingsLock({
            platformId,
            fn: async () => {
                const current = await emailDomainRepo().findOneBy({ id, platformId })
                if (current?.verificationStatus === SsoDomainVerificationStatus.VERIFIED) {
                    return false
                }
                await writeDomains({
                    log,
                    platformId,
                    userId,
                    ip,
                    removeSaml: false,
                    write: async (entityManager) => {
                        const updated = await emailDomainRepo(entityManager)
                            .createQueryBuilder()
                            .update()
                            .set({ verificationStatus: SsoDomainVerificationStatus.VERIFIED })
                            .where({ id, platformId, verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION })
                            .returning(['id'])
                            .execute()
                        if (!updated.raw?.length) {
                            throwDomainChangedDuringVerification()
                        }
                        const otherVerifiedCount = await emailDomainRepo(entityManager).countBy({ platformId, id: Not(id), verificationStatus: SsoDomainVerificationStatus.VERIFIED })
                        if (otherVerifiedCount > 0 && !multipleDomainsAllowed) {
                            throwMultipleDomainsDisabled()
                        }
                    },
                })
                return true
            },
        })
        if (verifiedByThisCall) {
            logDomainEvent({ log, platformId, userId, ip, action: ApplicationEventName.SSO_DOMAIN_VERIFIED, domain: emailDomain.domain })
        }
        return emailDomainRepo().findOneByOrFail({ id })
    },
    async remove({ platformId, id, userId, ip }: DomainParams): Promise<void> {
        await replaceDomain({ log, platformId, removedId: id, addedDomain: null, userId, ip })
    },
    async expirePending(): Promise<void> {
        const expired = await transaction(async (entityManager) => {
            const rows: unknown = await entityManager.query(`
                WITH locked AS (
                    SELECT p.id FROM "platform" p
                    WHERE EXISTS (
                        SELECT 1 FROM "email_domain" e
                        WHERE e."platformId" = p.id
                          AND e."verificationStatus" = $1
                          AND e."created" < NOW() - make_interval(days => $2)
                    )
                    FOR UPDATE SKIP LOCKED
                ), removed AS (
                    DELETE FROM "email_domain" e
                    USING locked
                    WHERE e."platformId" = locked.id
                      AND e."verificationStatus" = $1
                      AND e."created" < NOW() - make_interval(days => $2)
                    RETURNING e."platformId", e."domain"
                )
                SELECT "platformId", "domain" FROM removed
            `, [SsoDomainVerificationStatus.PENDING_VERIFICATION, PENDING_DOMAIN_TTL_DAYS])
            const removed = ExpiredDomainRows.parse(rows)
            await refreshPlatformColumns({ entityManager, platformIds: unique(removed.map((row) => row.platformId)) })
            return removed
        })
        for (const { platformId, domain } of expired) {
            platformSideEffects(log).onSsoDomainExpired({ platformId, domain })
        }
        if (expired.length > 0) {
            log.info({ affected: expired.length }, 'Expired pending email domains')
        }
    },
})

async function replaceDomain(params: ReplaceDomainParams): Promise<EmailDomain | null> {
    return platformService(params.log).runWithPlatformSettingsLock({
        platformId: params.platformId,
        fn: () => replaceDomainUnderLock(params),
    })
}

async function replaceDomainUnderLock({ log, platformId, removedId, addedDomain, userId, ip }: ReplaceDomainParams): Promise<EmailDomain | null> {
    const removed = isNil(removedId) ? null : await getOneOrThrow({ platformId, id: removedId })
    const added = isNil(addedDomain) ? null : normalizeDomain(addedDomain)
    const multipleDomainsAllowed = !isNil(added) && await hasMultipleDomainsFlag({ platformId, log })
    const removedWasVerified = removed?.verificationStatus === SsoDomainVerificationStatus.VERIFIED
    const removesLastVerifiedDomain = removedWasVerified && isNil(added) && (await emailDomainService(log).listVerifiedDomains({ platformId })).length === 1
    const removeSaml = removesLastVerifiedDomain && await platformService(log).hasSamlConfigured(platformId)
    const addedId = apId()
    await writeDomains({
        log,
        platformId,
        userId,
        ip,
        removeSaml,
        removedEmailDomain: removed?.domain,
        write: async (entityManager) => {
            if (!isNil(removed)) {
                await emailDomainRepo(entityManager).delete({ id: removed.id, platformId })
            }
            if (isNil(added)) {
                return
            }
            await assertDomainIsFree({ entityManager, platformId, domain: added })
            const domainCount = await emailDomainRepo(entityManager).countBy({ platformId })
            if (domainCount > 0 && !multipleDomainsAllowed) {
                throwMultipleDomainsDisabled()
            }
            await emailDomainRepo(entityManager).insert({
                id: addedId,
                platformId,
                domain: added,
                verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
                verificationRecordValue: `${VERIFICATION_VALUE_PREFIX}=${apId()}`,
            })
        },
    })
    if (!isNil(removed)) {
        const action = removedWasVerified ? ApplicationEventName.SSO_DOMAIN_REMOVED : ApplicationEventName.SSO_DOMAIN_VERIFICATION_CANCELLED
        logDomainEvent({ log, platformId, userId, ip, action, domain: removed.domain })
    }
    if (isNil(added)) {
        return null
    }
    logDomainEvent({ log, platformId, userId, ip, action: ApplicationEventName.SSO_DOMAIN_ADDED, domain: added })
    return emailDomainRepo().findOneByOrFail({ id: addedId })
}

async function writeDomains({ log, platformId, userId, ip, removeSaml, removedEmailDomain, write }: WriteDomainsParams): Promise<void> {
    const { error } = await tryCatch(() => platformService(log).update({
        id: platformId,
        userId,
        ip,
        removedEmailDomain,
        ...spreadIfDefined('federatedAuthProviders', removeSaml ? { saml: null } : undefined),
        saveInSameTransaction: async (entityManager) => {
            await write(entityManager)
            await refreshPlatformColumns({ entityManager, platformIds: [platformId] })
        },
    }))
    if (isUniqueViolation(error)) {
        throwDomainInUse()
    }
    if (!isNil(error)) {
        throw error
    }
}

async function refreshPlatformColumns({ entityManager, platformIds }: RefreshPlatformColumnsParams): Promise<void> {
    if (platformIds.length === 0) {
        return
    }
    const domains = await emailDomainRepo(entityManager).find({ where: { platformId: In(platformIds) }, order: { created: 'ASC' } })
    const shownDomains = platformIds.map((platformId) => {
        const platformDomains = domains.filter((emailDomain) => emailDomain.platformId === platformId)
        return platformDomains.find((emailDomain) => emailDomain.verificationStatus === SsoDomainVerificationStatus.VERIFIED) ?? platformDomains[0]
    })
    await entityManager.query(`
        UPDATE "platform" p
        SET "ssoDomain" = v."ssoDomain", "ssoDomainVerification" = v."ssoDomainVerification"::jsonb, "updated" = NOW()
        FROM unnest($1::varchar[], $2::varchar[], $3::text[]) AS v("id", "ssoDomain", "ssoDomainVerification")
        WHERE p."id" = v."id"
    `, [
        platformIds,
        shownDomains.map((shown) => shown?.domain ?? null),
        shownDomains.map((shown) => isNil(shown) ? null : JSON.stringify(toSsoDomainVerification(shown))),
    ])
}

function toSsoDomainVerification(emailDomain: EmailDomain): SsoDomainVerification {
    return {
        status: emailDomain.verificationStatus,
        record: {
            type: SsoDomainVerificationRecordType.TXT,
            name: toVerificationRecordName(emailDomain.domain),
            value: emailDomain.verificationRecordValue,
        },
        createdAt: new Date(emailDomain.created).toISOString(),
    }
}

async function assertDomainIsFree({ entityManager, platformId, domain }: AssertDomainIsFreeParams): Promise<void> {
    const addedHere = await emailDomainRepo(entityManager).existsBy({ platformId, domain })
    if (addedHere) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'This domain is already added',
            },
        })
    }
    const claimedByAnotherPlatform = await emailDomainRepo(entityManager).existsBy({ domain, platformId: Not(platformId) })
    if (claimedByAnotherPlatform) {
        throwDomainInUse()
    }
}

async function countPeopleByDomain({ platformId, domains }: CountPeopleByDomainParams): Promise<Map<string, number>> {
    if (domains.length === 0) {
        return new Map()
    }
    const rows: unknown = await emailDomainRepo().query(`
        SELECT lower(split_part(ui."email", '@', 2)) AS "domain", COUNT(*)::int AS "peopleCount"
        FROM "user" u
        JOIN "user_identity" ui ON ui."id" = u."identityId"
        WHERE u."platformId" = $1
          AND lower(split_part(ui."email", '@', 2)) = ANY($2)
        GROUP BY 1
    `, [platformId, domains])
    return new Map(PeopleCountRows.parse(rows).map((row) => [row.domain, row.peopleCount]))
}

async function getOneOrThrow({ platformId, id }: GetOneParams): Promise<EmailDomain> {
    const emailDomain = await emailDomainRepo().findOneBy({ id, platformId })
    if (isNil(emailDomain)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: `email domain with id ${id} not found`,
            },
        })
    }
    return emailDomain
}

async function hasMultipleDomainsFlag({ platformId, log }: HasMultipleDomainsFlagParams): Promise<boolean> {
    const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
    return plan.multipleEmailDomainsEnabled
}

function throwMultipleDomainsDisabled(): never {
    throw new ActivepiecesError({
        code: ErrorCode.FEATURE_DISABLED,
        params: {
            message: 'Multiple email domains are not enabled for this platform',
        },
    })
}

function throwDomainInUse(): never {
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: 'This SSO domain is already in use',
        },
    })
}

function throwDomainChangedDuringVerification(): never {
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: 'The SSO domain changed while it was being verified. Reload and try again.',
        },
    })
}

function normalizeDomain(domain: string): string {
    const normalized = domain.trim().toLowerCase()
    if (!z.hostname().safeParse(normalized).success || !normalized.includes('.')) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'SSO domain must be a valid lowercase domain (e.g. acme.com)',
            },
        })
    }
    return normalized
}

function logDomainEvent({ log, platformId, userId, ip, action, domain }: LogDomainEventParams): void {
    platformSideEffects(log).onAuthenticationSettingsChanged({
        platformId,
        userId,
        ip,
        events: [{ action, data: { domain } }],
    })
}

function toVerificationRecordName(domain: string): string {
    return `${VERIFICATION_NAME_PREFIX}.${domain}`
}

async function txtRecordMatches({ name, expected, log }: TxtRecordMatchesParams): Promise<boolean> {
    const lookup = await tryCatch(() => resolveTxt(name))
    if (lookup.error) {
        log.warn({ name, error: lookup.error }, 'TXT record lookup failed for email domain verification')
        return false
    }
    return lookup.data.some((chunks) => chunks.join('').trim() === expected)
}

const PENDING_DOMAIN_TTL_DAYS = 7
const VERIFICATION_NAME_PREFIX = '_activepieces-verify'
const VERIFICATION_VALUE_PREFIX = 'activepieces-verify'

const ExpiredDomainRows = z.array(z.object({
    platformId: z.string(),
    domain: z.string(),
}))

const PeopleCountRows = z.array(z.object({
    domain: z.string(),
    peopleCount: z.number(),
}))

type ListParams = {
    platformId: PlatformId
}

type AddParams = {
    platformId: PlatformId
    domain: string
    userId: UserId
    ip: string
}

type ReplaceParams = {
    platformId: PlatformId
    removedId: string | null
    addedDomain: string | null
    userId: UserId
    ip: string
}

type ReplaceDomainParams = ReplaceParams & {
    log: FastifyBaseLogger
}

type DomainParams = {
    platformId: PlatformId
    id: string
    userId: UserId
    ip: string
}

type GetOneParams = {
    platformId: PlatformId
    id: string
}

type WriteDomainsParams = {
    log: FastifyBaseLogger
    platformId: PlatformId
    userId: UserId
    ip: string
    removeSaml: boolean
    removedEmailDomain?: string
    write: (entityManager: EntityManager) => Promise<void>
}

type RefreshPlatformColumnsParams = {
    entityManager: EntityManager
    platformIds: PlatformId[]
}

type AssertDomainIsFreeParams = {
    entityManager: EntityManager
    platformId: PlatformId
    domain: string
}

type CountPeopleByDomainParams = {
    platformId: PlatformId
    domains: string[]
}

type HasMultipleDomainsFlagParams = {
    platformId: PlatformId
    log: FastifyBaseLogger
}

type LogDomainEventParams = {
    log: FastifyBaseLogger
    platformId: PlatformId
    userId: UserId
    ip: string
    action: AuthenticationDomainEvent['action']
    domain: string
}

type TxtRecordMatchesParams = {
    name: string
    expected: string
    log: FastifyBaseLogger
}
