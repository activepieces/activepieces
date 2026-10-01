import { apId } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { AppConnectionScope, AppConnectionStatus, AppConnectionType, OAuth2GrantType, PrincipalType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const TOKEN_URL = 'https://auth.example.com/realms/test/protocol/openid-connect/token'
const READS = 5

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

function mockTokenEndpoint({ expiresIn }: { expiresIn: number }) {
    let exchanges = 0
    const post = vi.spyOn(safeHttp.retryingAxios, 'post').mockImplementation(async () => {
        exchanges++
        return {
            data: {
                access_token: `access-${exchanges}`,
                refresh_token: `refresh-${exchanges}`,
                expires_in: expiresIn,
                token_type: 'Bearer',
            },
        }
    })
    return post
}

async function seedOAuth2Connection({ expiresIn, claimedSecondsAgo }: { expiresIn: number, claimedSecondsAgo: number }) {
    const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
    const externalId = apId()
    await db.save('app_connection', {
        id: apId(),
        created: dayjs().toISOString(),
        updated: dayjs().toISOString(),
        platformId: mockPlatform.id,
        projectIds: [mockProject.id],
        pieceName: '@activepieces/piece-short-lived-oauth2',
        pieceVersion: '0.1.0',
        displayName: 'short lived oauth2',
        type: AppConnectionType.OAUTH2,
        scope: AppConnectionScope.PROJECT,
        status: AppConnectionStatus.ACTIVE,
        ownerId: mockOwner.id,
        value: await encryptUtils.encryptObject({
            type: AppConnectionType.OAUTH2,
            client_id: 'client',
            client_secret: 'secret',
            redirect_url: 'http://localhost/redirect',
            token_url: TOKEN_URL,
            access_token: 'access-initial',
            refresh_token: 'refresh-initial',
            token_type: 'Bearer',
            scope: 'openid',
            expires_in: expiresIn,
            claimed_at: dayjs().unix() - claimedSecondsAgo,
            grant_type: OAuth2GrantType.AUTHORIZATION_CODE,
            data: {},
        }),
        metadata: {},
        externalId,
        preSelectForNewProjects: false,
    })
    const token = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        platform: { id: mockPlatform.id },
        projectId: mockProject.id,
    })
    return { externalId, token }
}

async function readAccessTokens({ externalId, token }: { externalId: string, token: string }): Promise<string[]> {
    const accessTokens: string[] = []
    for (let i = 0; i < READS; i++) {
        const response = await app!.inject({
            method: 'GET',
            url: `/api/v1/worker/app-connections/${externalId}`,
            headers: { authorization: `Bearer ${token}` },
        })
        expect(response.statusCode).toBe(200)
        accessTokens.push(response.json().value.access_token)
    }
    return accessTokens
}

describe('OAuth2 connection reads with short-lived access tokens', () => {
    it('reuses a freshly minted 300s token without any exchange', async () => {
        const post = mockTokenEndpoint({ expiresIn: 300 })
        const seeded = await seedOAuth2Connection({ expiresIn: 300, claimedSecondsAgo: 0 })

        const accessTokens = await readAccessTokens(seeded)

        expect(post).not.toHaveBeenCalled()
        expect(accessTokens).toEqual(Array(READS).fill('access-initial'))
    })

    it('reuses a freshly minted 900s token without any exchange', async () => {
        const post = mockTokenEndpoint({ expiresIn: 900 })
        const seeded = await seedOAuth2Connection({ expiresIn: 900, claimedSecondsAgo: 0 })

        const accessTokens = await readAccessTokens(seeded)

        expect(post).not.toHaveBeenCalled()
        expect(accessTokens).toEqual(Array(READS).fill('access-initial'))
    })

    it('refreshes a 300s token past half its lifetime once, saves it, and reuses it on later reads', async () => {
        const post = mockTokenEndpoint({ expiresIn: 300 })
        const seeded = await seedOAuth2Connection({ expiresIn: 300, claimedSecondsAgo: 200 })

        const accessTokens = await readAccessTokens(seeded)

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0][0]).toBe(TOKEN_URL)
        expect(accessTokens).toEqual(Array(READS).fill('access-1'))
    })

    it('refreshes an expired 300s token once and reuses the new one', async () => {
        const post = mockTokenEndpoint({ expiresIn: 300 })
        const seeded = await seedOAuth2Connection({ expiresIn: 300, claimedSecondsAgo: 400 })

        const accessTokens = await readAccessTokens(seeded)

        expect(post).toHaveBeenCalledTimes(1)
        expect(accessTokens).toEqual(Array(READS).fill('access-1'))
    })

    it('keeps the 15 minute buffer for a 3600s token', async () => {
        const post = mockTokenEndpoint({ expiresIn: 3600 })
        const fresh = await seedOAuth2Connection({ expiresIn: 3600, claimedSecondsAgo: 0 })
        const insideBuffer = await seedOAuth2Connection({ expiresIn: 3600, claimedSecondsAgo: 2760 })

        expect(await readAccessTokens(fresh)).toEqual(Array(READS).fill('access-initial'))
        expect(post).not.toHaveBeenCalled()

        expect(await readAccessTokens(insideBuffer)).toEqual(Array(READS).fill('access-1'))
        expect(post).toHaveBeenCalledTimes(1)
    })
})
