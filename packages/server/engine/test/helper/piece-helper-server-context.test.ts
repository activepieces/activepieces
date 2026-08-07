import { PropertyType } from '@activepieces/pieces-framework'
import { AppConnectionType } from '@activepieces/shared'
import type { ExecuteValidateAuthOperation } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLoadPieceOrThrow } = vi.hoisted(() => ({
    mockLoadPieceOrThrow: vi.fn(),
}))
vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        loadPieceOrThrow: mockLoadPieceOrThrow,
        getPackageAlias: vi.fn(),
        getPiecePath: vi.fn(),
        getPropOrThrow: vi.fn(),
    },
}))

import { pieceHelper } from '../../src/lib/helper/piece-helper'

const ENGINE_TOKEN = 'engine-token-under-test'

function makeOperation(): ExecuteValidateAuthOperation {
    return {
        piece: {
            pieceName: '@activepieces/piece-under-test',
            pieceVersion: '1.0.0',
        },
        auth: {
            type: AppConnectionType.OIDC,
            props: { roleArn: 'arn:aws:iam::123456789012:role/Example' },
        },
        platformId: 'platform-1',
        engineToken: ENGINE_TOKEN,
        internalApiUrl: 'http://127.0.0.1:3000/api',
        publicApiUrl: 'http://127.0.0.1:4200/api/',
        timeoutInSeconds: 30,
    } as unknown as ExecuteValidateAuthOperation
}

describe('piece-helper server context', () => {
    beforeEach(() => {
        mockLoadPieceOrThrow.mockReset()
    })

    it('passes the engine token to a piece auth validate hook', async () => {
        const validate = vi.fn().mockResolvedValue({ valid: true })
        mockLoadPieceOrThrow.mockResolvedValue({
            auth: { type: PropertyType.OIDC, validate },
        })

        const response = await pieceHelper.executeValidateAuth({ params: makeOperation(), devPieces: [] })

        expect(response).toEqual({ valid: true })
        expect(validate).toHaveBeenCalledTimes(1)
        expect(validate.mock.calls[0][0].server).toEqual({
            token: ENGINE_TOKEN,
            apiUrl: 'http://127.0.0.1:3000/api/',
            publicUrl: 'http://127.0.0.1:4200/api/',
        })
    })

    it('withholds the engine token from the getConnectionIdentifier hook', async () => {
        const getConnectionIdentifier = vi.fn().mockResolvedValue('account-label')
        mockLoadPieceOrThrow.mockResolvedValue({
            auth: { type: PropertyType.OIDC, getConnectionIdentifier },
        })

        const response = await pieceHelper.executeResolveConnectionIdentifier({
            params: { ...makeOperation(), connectionType: AppConnectionType.OIDC },
            devPieces: [],
        })

        expect(response).toEqual({ identifier: 'account-label' })
        expect(getConnectionIdentifier.mock.calls[0][0].server).toEqual({
            apiUrl: 'http://127.0.0.1:3000/api/',
            publicUrl: 'http://127.0.0.1:4200/api/',
        })
    })

    it('withholds the engine token from the custom-auth refresh hook', async () => {
        const generate = vi.fn().mockResolvedValue({ access_token: 'refreshed', expires_in: 3600 })
        mockLoadPieceOrThrow.mockResolvedValue({
            auth: { type: PropertyType.CUSTOM_AUTH, refresh: { generate } },
        })

        await pieceHelper.executeRefreshTokenAuth({
            params: {
                ...makeOperation(),
                auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'k' } },
            } as unknown as ExecuteValidateAuthOperation,
            devPieces: [],
        })

        expect(generate.mock.calls[0][0].server).toEqual({
            apiUrl: 'http://127.0.0.1:3000/api/',
            publicUrl: 'http://127.0.0.1:4200/api/',
        })
    })
})
