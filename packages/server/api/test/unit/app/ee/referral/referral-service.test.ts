import { beforeEach, describe, expect, it, vi } from 'vitest'
import { referralMatcher } from '../../../../../src/app/ee/referral/referral-matcher'

const CANONICAL = 'I grow potatoes in my room and I call them Ash'
const INVITER_PLATFORM = 'inviter-platform'
const INVITER_USER = 'inviter-user'

const {
    phraseRepo,
    redemptionRepo,
    mockGetRawOne,
    mockPlatformFindOneBy,
    mockGrant,
} = vi.hoisted(() => {
    const mockGetRawOne = vi.fn()
    return {
        phraseRepo: {
            findBy: vi.fn(),
            findOneBy: vi.fn(),
            find: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
        },
        redemptionRepo: {
            findOneBy: vi.fn(),
            insert: vi.fn(),
            delete: vi.fn(),
            countBy: vi.fn(),
            createQueryBuilder: vi.fn(() => {
                const qb: Record<string, unknown> = {}
                qb.select = () => qb
                qb.where = () => qb
                qb.getRawOne = mockGetRawOne
                return qb
            }),
        },
        mockGetRawOne,
        mockPlatformFindOneBy: vi.fn(),
        mockGrant: vi.fn().mockResolvedValue(undefined),
    }
})

vi.mock('../../../../../src/app/ee/referral/referral-phrase.entity', () => ({
    ReferralPhraseEntity: { options: { name: 'referral_phrase' } },
}))
vi.mock('../../../../../src/app/ee/referral/referral-redemption.entity', () => ({
    ReferralRedemptionEntity: { options: { name: 'referral_redemption' } },
}))
vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: (entity: { options: { name: string } }) => () =>
        (entity.options.name === 'referral_phrase' ? phraseRepo : redemptionRepo),
}))
vi.mock('../../../../../src/app/ee/referral/referral-flags', () => ({
    referralUtils: { isReferralEnabled: () => true, isReferralDevMode: () => false },
}))
vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedLock: () => ({
        runExclusive: ({ fn }: { fn: () => Promise<unknown> }) => fn(),
    }),
}))
vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformRepo: () => ({ findOneBy: mockPlatformFindOneBy }),
}))
vi.mock('../../../../../src/app/ee/referral/referral-side-effects', () => ({
    referralSideEffects: () => ({ grantAiCredits: mockGrant, generateHeroImage: vi.fn().mockResolvedValue(null) }),
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

async function detect(params: { redeemerPlatformId: string, redeemerUserId: string, text: string }): Promise<{ outcome: string, inviterGrantUsd?: number, redeemerGrantUsd?: number, capReached?: boolean, celebrationEmojis?: string[], celebrationScene?: unknown[] }> {
    const { referralService } = await import('../../../../../src/app/ee/referral/referral-service')
    return referralService(noopLogger as never).detectAndResolve(params)
}

async function getPhrase(params: { platformId: string, userId: string, proposedDisplayPhrase: string, replace?: boolean, emojis?: string[], scene?: unknown[] }): Promise<{ status: string, displayPhrase?: string }> {
    const { referralService } = await import('../../../../../src/app/ee/referral/referral-service')
    return referralService(noopLogger as never).getOrCreatePhrase(params)
}

function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

describe('referralService.detectAndResolve', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // A single active phrase owned by the inviter; the module cache reads it once and reuses it.
        phraseRepo.findBy.mockResolvedValue([{
            id: 'phrase-1',
            normalizedPhrase: referralMatcher.normalize(CANONICAL),
            platformId: INVITER_PLATFORM,
            userId: INVITER_USER,
            displayPhrase: CANONICAL,
            celebrationEmojis: ['🥔', '🚪'],
            celebrationScene: [{ a: 0, do: 'enter' }, { a: 0, do: 'into', t: 1 }],
        }])
        redemptionRepo.findOneBy.mockResolvedValue(null)
        redemptionRepo.insert.mockResolvedValue(undefined)
        mockGetRawOne.mockResolvedValue({ total: '0' })
        mockPlatformFindOneBy.mockResolvedValue({ id: 'redeemer-platform', created: new Date() })
        mockGrant.mockResolvedValue(undefined)
    })

    it('releases $10 to both sides for an eligible new redeemer', async () => {
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: CANONICAL })
        expect(result.outcome).toBe('released')
        expect(result.redeemerGrantUsd).toBe(10)
        expect(result.inviterGrantUsd).toBe(10)
        expect(redemptionRepo.insert).toHaveBeenCalledTimes(1)
        expect(mockGrant).toHaveBeenCalledWith({ platformId: 'redeemer-platform', amountInUsd: 10 })
        expect(mockGrant).toHaveBeenCalledWith({ platformId: INVITER_PLATFORM, amountInUsd: 10 })
        expect(result.celebrationEmojis).toEqual(['🥔', '🚪'])
        expect(result.celebrationScene).toEqual([{ a: 0, do: 'enter' }, { a: 0, do: 'into', t: 1 }])
    })

    it('tolerates typos within the narrow threshold', async () => {
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: 'I grow potatos in my room and I call them Ash' })
        expect(result.outcome).toBe('released')
    })

    it('rejects a self-referral (redeemer is the inviter platform), no grant', async () => {
        const result = await detect({ redeemerPlatformId: INVITER_PLATFORM, redeemerUserId: INVITER_USER, text: CANONICAL })
        expect(result.outcome).toBe('self_referral')
        expect(mockGrant).not.toHaveBeenCalled()
        expect(redemptionRepo.insert).not.toHaveBeenCalled()
        expect(result.celebrationEmojis).toEqual(['🥔', '🚪'])
    })

    it('rejects an account older than the new-signup window, no grant', async () => {
        mockPlatformFindOneBy.mockResolvedValue({ id: 'redeemer-platform', created: daysAgo(60) })
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: CANONICAL })
        expect(result.outcome).toBe('ineligible_account')
        expect(mockGrant).not.toHaveBeenCalled()
    })

    it('rejects a second redemption by the same redeemer, no grant', async () => {
        redemptionRepo.findOneBy.mockResolvedValue({ id: 'existing-redemption', redeemerPlatformId: 'redeemer-platform' })
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: CANONICAL })
        expect(result.outcome).toBe('already_redeemed')
        expect(mockGrant).not.toHaveBeenCalled()
    })

    it('at the $250 cap, still pays the redeemer $10 but pays the inviter $0 (CAPPED)', async () => {
        mockGetRawOne.mockResolvedValue({ total: '250' })
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: CANONICAL })
        expect(result.outcome).toBe('released')
        expect(result.capReached).toBe(true)
        expect(result.inviterGrantUsd).toBe(0)
        expect(result.redeemerGrantUsd).toBe(10)
        expect(mockGrant).toHaveBeenCalledWith({ platformId: 'redeemer-platform', amountInUsd: 10 })
        expect(mockGrant).toHaveBeenCalledWith({ platformId: INVITER_PLATFORM, amountInUsd: 0 })
    })

    it('does not match a semantic paraphrase (no grant, no redemption row)', async () => {
        const result = await detect({ redeemerPlatformId: 'redeemer-platform', redeemerUserId: 'redeemer-user', text: 'I keep a potato plant in my bedroom that I named Ash' })
        expect(result.outcome).toBe('no_match')
        expect(mockGrant).not.toHaveBeenCalled()
    })
})

describe('referralService.getOrCreatePhrase', () => {
    const NEW_PHRASE = 'sam fed a sardine some fine cuisine'

    beforeEach(() => {
        vi.clearAllMocks()
        phraseRepo.findOneBy.mockResolvedValue(null)
        phraseRepo.insert.mockResolvedValue(undefined)
    })

    it('creates a phrase that is safely distinct from every existing one', async () => {
        phraseRepo.find.mockResolvedValue([{ normalizedPhrase: referralMatcher.normalize('pov mia just rerouted your entire personality') }])
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE })
        expect(result.status).toBe('created')
        expect(phraseRepo.insert).toHaveBeenCalledTimes(1)
    })

    it('rejects a phrase too close to an existing one (too_similar, no insert)', async () => {
        phraseRepo.find.mockResolvedValue([{ normalizedPhrase: referralMatcher.normalize('sam fed a sardine some fine cusine') }])
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE })
        expect(result.status).toBe('too_similar')
        expect(phraseRepo.insert).not.toHaveBeenCalled()
    })

    it('persists a sanitized emoji cast on create', async () => {
        phraseRepo.find.mockResolvedValue([])
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE, emojis: [' 🐟 ', '', '🍽️', 'this-is-not-an-emoji-way-too-long'] })
        expect(result.status).toBe('created')
        expect(phraseRepo.insert.mock.calls[0][0].celebrationEmojis).toEqual(['🐟', '🍽️'])
    })

    it('overwrites the emoji cast on replace, clearing it when none provided', async () => {
        phraseRepo.findOneBy.mockResolvedValue({ id: 'phrase-1', displayPhrase: 'old', normalizedPhrase: 'old' })
        phraseRepo.find.mockResolvedValue([])
        phraseRepo.update.mockResolvedValue(undefined)
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE, replace: true })
        expect(result.status).toBe('replaced')
        expect(phraseRepo.update.mock.calls[0][1].celebrationEmojis).toBeNull()
    })

    it('persists a sanitized scene beat-sheet on create', async () => {
        phraseRepo.find.mockResolvedValue([])
        const result = await getPhrase({
            platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE, emojis: ['🐟', '🍽️'],
            scene: [{ a: 0, do: 'enter' }, { a: 0, do: 'into', t: 1 }, { a: 9, do: 'enter' }, { a: 0, do: 'teleport' }],
        })
        expect(result.status).toBe('created')
        // out-of-range actor + unknown action dropped; valid beats kept
        expect(phraseRepo.insert.mock.calls[0][0].celebrationScene).toEqual([{ a: 0, do: 'enter' }, { a: 0, do: 'into', t: 1 }])
    })

    it('stores null scene when the model provides none', async () => {
        phraseRepo.find.mockResolvedValue([])
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE, emojis: ['🐟', '🍽️'] })
        expect(result.status).toBe('created')
        expect(phraseRepo.insert.mock.calls[0][0].celebrationScene).toBeNull()
    })

    it('rejects a phrase with no rhyme (no_rhyme, no insert)', async () => {
        phraseRepo.find.mockResolvedValue([])
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: 'Ash built a library inside a teacup' })
        expect(result.status).toBe('no_rhyme')
        expect(phraseRepo.insert).not.toHaveBeenCalled()
    })

    it('returns the existing phrase without regenerating (one per user)', async () => {
        phraseRepo.findOneBy.mockResolvedValue({ displayPhrase: 'existing one', normalizedPhrase: 'existing one' })
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE })
        expect(result.status).toBe('existing')
        expect(result.displayPhrase).toBe('existing one')
        expect(phraseRepo.insert).not.toHaveBeenCalled()
    })

    it('reissues (replace=true) by updating the SAME row, not inserting a new one', async () => {
        phraseRepo.findOneBy.mockResolvedValue({ id: 'phrase-1', displayPhrase: 'Sam claims he invented Mondays', normalizedPhrase: 'sam claims he invented mondays' })
        phraseRepo.find.mockResolvedValue([])
        phraseRepo.update.mockResolvedValue(undefined)
        const result = await getPhrase({ platformId: 'p1', userId: 'u1', proposedDisplayPhrase: NEW_PHRASE, replace: true })
        expect(result.status).toBe('replaced')
        expect(result.displayPhrase).toBe(NEW_PHRASE)
        expect(phraseRepo.update).toHaveBeenCalledTimes(1)
        expect(phraseRepo.update.mock.calls[0][0]).toBe('phrase-1')
        expect(phraseRepo.insert).not.toHaveBeenCalled()
    })
})
