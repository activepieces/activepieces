import { apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import {
    ChatPersonalization,
    ChatPersonalizationStatus,
    PersonalizationProfile,
    PersonalizationUseCase,
    PlatformRole,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { userService } from '../../../user/user-service'
import { ChatPersonalizationEntity } from './chat-personalization-entity'

export const personalizationRepo = repoFactory(ChatPersonalizationEntity)

export async function findRow({ platformId, userId }: { platformId: string, userId: string | null }): Promise<ChatPersonalization | null> {
    return personalizationRepo().findOneBy(
        isNil(userId) ? { platformId, userId: IsNull() } : { platformId, userId },
    )
}


export async function upsertFoundingUserRow({ platformId, userId, researchToken, validated, log }: {
    platformId: string
    userId: string
    researchToken: string | null
    validated: ValidatedResult
    log: FastifyBaseLogger
}): Promise<void> {
    if (isNil(researchToken)) {
        return
    }
    const profile = validated.profile === null ? null : JSON.stringify(sanitizeObjectForPostgresql(validated.profile))
    const useCases = validated.useCases === null ? null : JSON.stringify(sanitizeObjectForPostgresql(validated.useCases))
    const seeded: { id: string }[] = await personalizationRepo().query(
        `
        INSERT INTO "chat_personalization" ("id", "created", "updated", "platformId", "userId", "domain", "companyText", "role", "status", "researchToken", "profile", "useCases")
        SELECT $1, now(), now(), $2, $3, NULL, NULL, NULL, $4, NULL, $5::jsonb, $6::jsonb
        WHERE EXISTS (
            SELECT 1 FROM "chat_personalization"
            WHERE "platformId" = $2 AND "userId" IS NULL AND "researchToken" = $7
        )
        ON CONFLICT ("platformId", "userId") WHERE "userId" IS NOT NULL
        DO UPDATE SET
            "status" = EXCLUDED."status",
            "profile" = EXCLUDED."profile",
            "useCases" = EXCLUDED."useCases",
            "updated" = now()
        WHERE "chat_personalization"."researchToken" = $7
           OR ("chat_personalization"."status" <> ALL($8::varchar[])
               AND "chat_personalization"."useCases" IS NULL)
        RETURNING "id"
        `,
        [apId(), platformId, userId, ChatPersonalizationStatus.READY, profile, useCases, researchToken, IN_FLIGHT_STATUSES],
    )
    if (seeded.length === 0) {
        log.info({ platform: { id: platformId }, user: { id: userId }, researchToken }, '[chatPersonalization] Founding-user seed skipped, the run was superseded or that row has its own research')
    }
}


export async function writeCompanyRow({ platformId, existing, patch }: {
    platformId: string
    existing: ChatPersonalization | null
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'companyText' | 'role' | 'status' | 'researchToken' | 'profile' | 'useCases'>>
}): Promise<void> {
    if (isNil(existing)) {
        const { error } = await tryCatch(() => personalizationRepo().insert({
            id: apId(),
            platformId,
            userId: null,
            domain: patch.domain ?? null,
            companyText: patch.companyText ?? null,
            role: patch.role ?? null,
            status: patch.status ?? ChatPersonalizationStatus.PENDING,
            researchToken: patch.researchToken ?? null,
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
    }
    await personalizationRepo().update({ platformId, userId: IsNull() }, patch)
}


export async function callerMayEditCompany({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<boolean> {
    const user = await tryCatch(() => userService(log).getMetaInformation({ id: userId }))
    if (user.error) {
        log.warn({ platform: { id: platformId }, user: { id: userId }, error: user.error }, '[chatPersonalization] Could not read the platform role, leaving the company as it is')
        return false
    }
    if (user.data.platformRole === PlatformRole.ADMIN) {
        return true
    }
    log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] Company edit ignored, the platform company is admin-owned')
    return false
}


export async function writeUserRow({ platformId, userId, patch }: {
    platformId: string
    userId: string
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'companyText' | 'role' | 'status' | 'researchToken' | 'profile' | 'useCases'>>
}): Promise<void> {
    const existing = await findRow({ platformId, userId })
    if (isNil(existing)) {
        const { error } = await tryCatch(() => personalizationRepo().insert({
            id: apId(),
            platformId,
            userId,
            domain: patch.domain ?? null,
            companyText: patch.companyText ?? null,
            role: patch.role ?? null,
            status: patch.status ?? ChatPersonalizationStatus.PENDING,
            researchToken: patch.researchToken ?? null,
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
    }
    await personalizationRepo().update({ platformId, userId }, patch)
}


export type UpsertParams = {
    platformId: string
    userId: string
    website?: string
    role?: string
    personalize: boolean
}


export type ValidatedResult = {
    status: ChatPersonalizationStatus
    profile: PersonalizationProfile | null
    useCases: PersonalizationUseCase[] | null
}

export const IN_FLIGHT_STATUSES = [ChatPersonalizationStatus.PENDING, ChatPersonalizationStatus.RESEARCHING]
