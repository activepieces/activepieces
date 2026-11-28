import { apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { PlatformRole, PrincipalType, ReleaseFeedEntry, ReleaseKind } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { DEFAULT_RELEASE_FEED_URL } from '../../../../src/app/release-feed/release-feed.service'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let clockOffsetMs = 0
let feedResponse: () => Promise<{ data: unknown }> = () => Promise.reject(new Error('ENOTFOUND cdn.activepieces.com'))

const realNow = Date.now.bind(Date)
const current = apVersionUtil.getCurrentRelease()
const [major, minor] = current.split('.').map(Number)
const olderLine = `${major}.${minor - 1}`
const newerLine = `${major}.${minor + 1}`

beforeAll(async () => {
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + clockOffsetMs)
    const realGet = safeHttp.axios.get.bind(safeHttp.axios)
    vi.spyOn(safeHttp.axios, 'get').mockImplementation((url, config) => url === DEFAULT_RELEASE_FEED_URL ? feedResponse() : realGet(url, config))
    app = await setupTestEnvironment()
})

afterAll(async () => {
    vi.restoreAllMocks()
    await teardownTestEnvironment()
})

describe('Release feed API', () => {
    it('reports no feed and an unknown latest version when the feed was never fetched', async () => {
        const ctx = await createTestContext(app!)

        const releases = await ctx.get('/v1/releases')
        expect(releases?.statusCode).toBe(StatusCodes.OK)
        expect(releases?.json()).toEqual({ fetchedAt: null, entries: [] })

        const health = await ctx.get('/v1/health/system')
        expect(health?.statusCode).toBe(StatusCodes.OK)
        expect(health?.json()).toMatchObject({ latestVersion: null, hotfixOnYourLine: null })
    })

    it('serves the fetched feed with fetchedAt and skips entries that do not match the schema', async () => {
        clockOffsetMs += 6 * MINUTE_MS
        feedResponse = () => Promise.resolve({ data: [...FEED, { tag: 'not-a-release' }] })
        const ctx = await createTestContext(app!)

        const response = await ctx.get('/v1/releases')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const body = response?.json()
        expect(body.fetchedAt).toEqual(expect.any(String))
        expect(body.entries.map((entry: ReleaseFeedEntry) => entry.tag)).toEqual(FEED.map((entry) => entry.tag))
    })

    it('reads the latest release and a hotfix on the running line from the feed', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.get('/v1/health/system')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json()).toMatchObject({
            latestVersion: `${newerLine}.1`,
            hotfixOnYourLine: `${current}-hotfix.1`,
        })
    })

    it('serves the cached copy within the hour without fetching again', async () => {
        const ctx = await createTestContext(app!)
        const first = await ctx.get('/v1/releases')
        clockOffsetMs += 30 * MINUTE_MS
        feedResponse = () => Promise.resolve({ data: [] })

        const second = await ctx.get('/v1/releases')

        expect(second?.json()).toEqual(first?.json())
        expect(second?.json().entries).toHaveLength(FEED.length)
    })

    it('keeps the last copy and its fetchedAt when a fetch fails after the hour', async () => {
        const before = (await (await createTestContext(app!)).get('/v1/releases'))?.json()
        clockOffsetMs += 2 * HOUR_MS
        feedResponse = () => Promise.reject(new Error('ETIMEDOUT'))
        const ctx = await createTestContext(app!)

        const after = await ctx.get('/v1/releases')
        const health = await ctx.get('/v1/health/system')

        expect(after?.statusCode).toBe(StatusCodes.OK)
        expect(after?.json()).toEqual(before)
        expect(health?.json().latestVersion).toBe(`${newerLine}.1`)
    })

    it('rejects a platform member who is not an admin', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const { mockUser } = await mockBasicUser({
            user: {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            },
        })
        const token = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
            platform: { id: mockPlatform.id },
        })

        const response = await app?.inject({
            method: 'GET',
            url: '/api/v1/releases',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

function feedEntry({ tag, kind }: { tag: string, kind: ReleaseKind }): ReleaseFeedEntry {
    return {
        tag,
        kind,
        line: tag.split('.').slice(0, 2).join('.'),
        releasedAt: '2026-11-24T14:00:00Z',
        imageDigest: `sha256:${'a'.repeat(64)}`,
        migrations: { blocking: 0, background: 0, breaking: [] },
        notes: [],
        pieceMigrations: [],
        supportedUntil: null,
    }
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

const FEED: ReleaseFeedEntry[] = [
    feedEntry({ tag: `${major}.${minor + 2}.0-rc.1`, kind: ReleaseKind.RC }),
    feedEntry({ tag: `${newerLine}.1`, kind: ReleaseKind.PATCH }),
    feedEntry({ tag: `${newerLine}.0`, kind: ReleaseKind.MINOR }),
    feedEntry({ tag: `${current}-hotfix.1`, kind: ReleaseKind.HOTFIX }),
    feedEntry({ tag: `${olderLine}.3-hotfix.1`, kind: ReleaseKind.HOTFIX }),
]
