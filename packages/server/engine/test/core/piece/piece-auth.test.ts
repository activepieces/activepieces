import { PieceAuth, PieceAuthProperty, PropertyType } from '@activepieces/pieces-framework'
import { AppConnectionType, AppConnectionValue, PiecePackage } from '@activepieces/shared'
import { pieceAuth } from '../../../src/lib/core/piece/piece-auth'
import { CollectedHooks, PieceDescription } from '../../../src/lib/core/piece/piece-protocol'
import { pieceRunner } from '../../../src/lib/core/piece/piece-runner'

const PIECE = { pieceName: '@activepieces/piece-test', pieceVersion: '1.0.0' } as unknown as PiecePackage

const HOOKS: CollectedHooks = { hookResponse: {}, listeners: [] } as unknown as CollectedHooks

const SECRET_TEXT_AUTH = PieceAuth.SecretText({ displayName: 'API Key', required: true })
const CUSTOM_AUTH = PieceAuth.CustomAuth({ displayName: 'Custom', required: true, props: {} })

const SECRET_TEXT_VALUE: AppConnectionValue = { type: AppConnectionType.SECRET_TEXT, secret_text: 'my-secret' }
const CUSTOM_AUTH_VALUE: AppConnectionValue = { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'k' } }

function makeDescription({ auth, paths }: MakeDescriptionParams): PieceDescription {
    return {
        metadata: { auth } as unknown as PieceDescription['metadata'],
        functionPaths: paths,
        hasPath: (path: string[]) => paths.includes(path.join('.')),
    }
}

function operationFor(auth: AppConnectionValue) {
    return {
        piece: PIECE,
        auth,
        internalApiUrl: 'http://internal',
        publicApiUrl: 'http://public',
    }
}

describe('piece-auth callMethod', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('unwraps the piece value from the { result, hooks } wrapper', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: SECRET_TEXT_AUTH, paths: ['auth.validate'] }))
        vi.spyOn(pieceRunner, 'call').mockResolvedValue({ result: { valid: true }, hooks: HOOKS })

        const result = await pieceAuth.callMethod({ operation: operationFor(SECRET_TEXT_VALUE), authValueType: AppConnectionType.SECRET_TEXT, methodPath: ['validate'] })

        expect(result).toEqual({ called: true, property: SECRET_TEXT_AUTH, result: { valid: true } })
    })

    it('unwraps the refresh result so access_token is reachable', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: CUSTOM_AUTH, paths: ['auth.refresh.generate'] }))
        vi.spyOn(pieceRunner, 'call').mockResolvedValue({ result: { access_token: 'tok', expires_in: 60 }, hooks: HOOKS })

        const result = await pieceAuth.callMethod({ operation: operationFor(CUSTOM_AUTH_VALUE), authValueType: AppConnectionType.CUSTOM_AUTH, methodPath: ['refresh', 'generate'] })

        expect(result).toEqual({ called: true, property: CUSTOM_AUTH, result: { access_token: 'tok', expires_in: 60 } })
    })

    it('passes the resolved path, argument and slash-normalized server url to the runner', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: SECRET_TEXT_AUTH, paths: ['auth.validate'] }))
        const call = vi.spyOn(pieceRunner, 'call').mockResolvedValue({ result: { valid: true }, hooks: HOOKS })

        await pieceAuth.callMethod({ operation: operationFor(SECRET_TEXT_VALUE), authValueType: AppConnectionType.SECRET_TEXT, methodPath: ['validate'] })

        expect(call).toHaveBeenCalledWith({
            piece: expect.objectContaining({ pieceName: '@activepieces/piece-test', pieceVersion: '1.0.0' }),
            path: ['auth', 'validate'],
            args: [{ auth: 'my-secret', server: { apiUrl: 'http://internal/', publicUrl: 'http://public' } }],
        })
    })

    it('selects the indexed auth path when the piece exposes an auth array', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: [SECRET_TEXT_AUTH, CUSTOM_AUTH], paths: ['auth.1.validate'] }))
        const call = vi.spyOn(pieceRunner, 'call').mockResolvedValue({ result: { valid: true }, hooks: HOOKS })

        await pieceAuth.callMethod({ operation: operationFor(CUSTOM_AUTH_VALUE), authValueType: AppConnectionType.CUSTOM_AUTH, methodPath: ['validate'] })

        expect(call).toHaveBeenCalledWith(expect.objectContaining({ path: ['auth', '1', 'validate'] }))
    })

    it('returns called:false when the piece declares no auth', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: undefined, paths: [] }))
        const call = vi.spyOn(pieceRunner, 'call')

        const result = await pieceAuth.callMethod({ operation: operationFor(SECRET_TEXT_VALUE), authValueType: AppConnectionType.SECRET_TEXT, methodPath: ['validate'] })

        expect(result).toEqual({ called: false })
        expect(call).not.toHaveBeenCalled()
    })

    it('returns called:false with the property when the method path is absent', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: SECRET_TEXT_AUTH, paths: [] }))
        const call = vi.spyOn(pieceRunner, 'call')

        const result = await pieceAuth.callMethod({ operation: operationFor(SECRET_TEXT_VALUE), authValueType: AppConnectionType.SECRET_TEXT, methodPath: ['validate'] })

        expect(result).toEqual({ called: false, property: SECRET_TEXT_AUTH })
        expect(call).not.toHaveBeenCalled()
    })

    it('returns called:false with mismatch when the connection value type does not fit the property', async () => {
        vi.spyOn(pieceRunner, 'describe').mockResolvedValue(makeDescription({ auth: SECRET_TEXT_AUTH, paths: ['auth.validate'] }))
        const call = vi.spyOn(pieceRunner, 'call')

        const result = await pieceAuth.callMethod({ operation: operationFor(CUSTOM_AUTH_VALUE), authValueType: AppConnectionType.SECRET_TEXT, methodPath: ['validate'] })

        expect(result).toEqual({ called: false, property: SECRET_TEXT_AUTH, mismatch: true })
        expect(call).not.toHaveBeenCalled()
    })
})

type MakeDescriptionParams = {
    auth: PieceAuthProperty | PieceAuthProperty[] | undefined
    paths: string[]
}
