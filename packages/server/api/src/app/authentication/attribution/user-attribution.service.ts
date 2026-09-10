import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { AttributionParams, SignUpMethod } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { UserAttribution, UserAttributionEntity } from './user-attribution.entity'

const userAttributionRepo = repoFactory<UserAttribution>(UserAttributionEntity)

export const userAttributionService = (log: FastifyBaseLogger) => ({
    async record({ userId, platformId, identityId, method, attribution }: RecordParams): Promise<void> {
        if (isNil(userId)) {
            await recordPendingForIdentity({ identityId, method, attribution, log })
            return
        }
        const existingForUser = await userAttributionRepo().findOneBy({ userId })
        if (!isNil(existingForUser)) {
            return
        }
        const pending = isNil(identityId) ? null : await userAttributionRepo().findOneBy({ identityId, userId: IsNull() })
        if (!isNil(pending)) {
            await userAttributionRepo().update(pending.id, { userId, platformId })
            return
        }
        const { error } = await tryCatch(() => userAttributionRepo().insert(newRow({ userId, platformId, identityId, method, attribution })))
        if (!isNil(error)) {
            log.info({ error, user: { id: userId } }, '[userAttributionService#record] attribution already recorded for user')
        }
    },
})

async function recordPendingForIdentity({ identityId, method, attribution, log }: RecordPendingParams): Promise<void> {
    if (isNil(identityId)) {
        return
    }
    const existing = await userAttributionRepo().findOneBy({ identityId })
    if (!isNil(existing)) {
        return
    }
    const { error } = await tryCatch(() => userAttributionRepo().insert(newRow({ userId: null, platformId: null, identityId, method, attribution })))
    if (!isNil(error)) {
        log.info({ error, identity: { id: identityId } }, '[userAttributionService#record] attribution already recorded for identity')
    }
}

function newRow({ userId, platformId, identityId, method, attribution }: RecordParams): Omit<UserAttribution, 'created' | 'updated'> {
    return {
        id: apId(),
        userId: userId ?? null,
        platformId: platformId ?? null,
        identityId: identityId ?? null,
        method,
        sessionId: attribution?.ap_sid ?? null,
        utmSource: attribution?.utm_source ?? null,
        utmMedium: attribution?.utm_medium ?? null,
        utmCampaign: attribution?.utm_campaign ?? null,
        utmTerm: attribution?.utm_term ?? null,
        utmContent: attribution?.utm_content ?? null,
        gclid: attribution?.gclid ?? null,
        fbclid: attribution?.fbclid ?? null,
        ref: attribution?.ref ?? null,
        apCta: attribution?.ap_cta ?? null,
        landingPath: attribution?.ap_landing ?? null,
        referrer: attribution?.ap_referrer ?? null,
    }
}

export type SignUpContext = {
    method: SignUpMethod
    attribution?: AttributionParams
}

type RecordParams = SignUpContext & {
    userId: string | null
    platformId: string | null
    identityId: string | null
}

type RecordPendingParams = SignUpContext & {
    identityId: string | null
    log: FastifyBaseLogger
}
