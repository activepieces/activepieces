import { apId, ErrorCode } from '@activepieces/core-utils'
import { PropertyType } from '@activepieces/pieces-framework'
import { PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { oauth2Util } from '../../../../src/app/app-connection/app-connection-service/oauth2/oauth2-util'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const shortText = (displayName: string) => ({
    type: PropertyType.SHORT_TEXT,
    displayName,
    required: true,
})

const saveOAuth2Piece = async ({ platformId, tokenUrl, scope, props }: {
    platformId: string
    tokenUrl: string
    scope: string[]
    props: Record<string, unknown>
}): Promise<string> => {
    const pieceName = `piece-${apId()}`
    await db.save('piece_metadata', createMockPieceMetadata({
        name: pieceName,
        version: '1.0.0',
        platformId,
        pieceType: PieceType.CUSTOM,
        packageType: PackageType.REGISTRY,
        minimumSupportedRelease: '0.0.0',
        maximumSupportedRelease: '999.999.999',
        auth: {
            type: PropertyType.OAUTH2,
            displayName: 'Connection',
            required: true,
            authUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/authorize',
            tokenUrl,
            scope,
            props,
        },
    }))
    return pieceName
}

describe('OAuth2 unresolved placeholder guard', () => {
    it('rejects a token url whose placeholder has no matching prop, naming the prop label', async () => {
        const platformId = apId()
        const pieceName = await saveOAuth2Piece({
            platformId,
            tokenUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/token',
            scope: ['Mail.Read'],
            props: { cloud: shortText('Cloud Environment'), tenant: shortText('Tenant ID') },
        })

        await expect(oauth2Util(mockLog).getOAuth2TokenUrl({
            platformId,
            pieceName,
            pieceVersion: '1.0.0',
            props: { cloud: 'login.microsoftonline.com' },
        })).rejects.toMatchObject({
            error: {
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: { error: expect.stringContaining('Tenant ID') },
            },
        })
    })

    it('rejects a prop that is present but empty', async () => {
        const platformId = apId()
        const pieceName = await saveOAuth2Piece({
            platformId,
            tokenUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/token',
            scope: ['Mail.Read'],
            props: { cloud: shortText('Cloud Environment'), tenant: shortText('Tenant ID') },
        })

        await expect(oauth2Util(mockLog).getOAuth2TokenUrl({
            platformId,
            pieceName,
            pieceVersion: '1.0.0',
            props: { cloud: 'login.microsoftonline.com', tenant: '   ' },
        })).rejects.toMatchObject({
            error: {
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: { error: expect.stringContaining('Tenant ID') },
            },
        })
    })

    it('rejects a placeholder that only appears in the declared scope', async () => {
        const platformId = apId()
        const pieceName = await saveOAuth2Piece({
            platformId,
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            scope: ['{accessMode}'],
            props: { accessMode: shortText('Access Mode') },
        })

        await expect(oauth2Util(mockLog).getOAuth2TokenUrl({
            platformId,
            pieceName,
            pieceVersion: '1.0.0',
            props: {},
        })).rejects.toMatchObject({
            error: {
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: { error: expect.stringContaining('Access Mode') },
            },
        })
    })

    it('resolves the token url when every placeholder is supplied', async () => {
        const platformId = apId()
        const pieceName = await saveOAuth2Piece({
            platformId,
            tokenUrl: 'https://{cloud}/{tenant}/oauth2/v2.0/token',
            scope: ['Mail.Read'],
            props: { cloud: shortText('Cloud Environment'), tenant: shortText('Tenant ID') },
        })

        const tokenUrl = await oauth2Util(mockLog).getOAuth2TokenUrl({
            platformId,
            pieceName,
            pieceVersion: '1.0.0',
            props: { cloud: 'login.microsoftonline.com', tenant: 'common' },
        })

        expect(tokenUrl).toBe('https://login.microsoftonline.com/common/oauth2/v2.0/token')
    })

    it('accepts braces that come from a prop value rather than the template', async () => {
        const platformId = apId()
        const pieceName = await saveOAuth2Piece({
            platformId,
            tokenUrl: '{tokenUrl}',
            scope: ['{scopes}'],
            props: { tokenUrl: shortText('Token URL'), scopes: shortText('Scopes') },
        })

        const tokenUrl = await oauth2Util(mockLog).getOAuth2TokenUrl({
            platformId,
            pieceName,
            pieceVersion: '1.0.0',
            props: { tokenUrl: 'https://id.example.com/{realm}/token', scopes: 'openid' },
        })

        expect(tokenUrl).toBe('https://id.example.com/{realm}/token')
    })
})
