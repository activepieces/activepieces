import { ScriptSession } from '../../../src/lib/core/code/code-sandbox-common'

const { createScriptSessionMock } = vi.hoisted(() => ({
    createScriptSessionMock: vi.fn(),
}))

vi.mock('../../../src/lib/core/code/code-sandbox', () => ({
    initCodeSandbox: async () => ({ createScriptSession: createScriptSessionMock }),
}))

// eslint-disable-next-line import/first
import { createSharedScriptSession } from '../../../src/lib/core/code/shared-script-session'

const buildSession = (): ScriptSession => ({
    run: vi.fn(),
    setGlobal: vi.fn(),
    dispose: vi.fn(),
})

const buildParams = async () => ({ scriptContext: {}, functions: {} })

describe('createSharedScriptSession', () => {
    beforeEach(() => {
        createScriptSessionMock.mockReset()
    })

    it('retries the creation on the next get after a failed one', async () => {
        const session = buildSession()
        createScriptSessionMock.mockRejectedValueOnce(new Error('spawn failed')).mockResolvedValueOnce(session)
        const shared = createSharedScriptSession(buildParams)

        await expect(shared.get()).rejects.toThrow('spawn failed')
        await expect(shared.get()).resolves.toBe(session)
        expect(createScriptSessionMock).toHaveBeenCalledTimes(2)
    })

    it('reuses one session across gets and disposes it once', async () => {
        const session = buildSession()
        createScriptSessionMock.mockResolvedValue(session)
        const shared = createSharedScriptSession(buildParams)

        await shared.get()
        await shared.get()
        await shared.dispose()

        expect(createScriptSessionMock).toHaveBeenCalledTimes(1)
        expect(session.dispose).toHaveBeenCalledTimes(1)
    })

    it('does not create a new session after dispose when the creation had failed', async () => {
        createScriptSessionMock.mockRejectedValue(new Error('spawn failed'))
        const shared = createSharedScriptSession(buildParams)

        const pending = shared.get()
        await shared.dispose()
        await expect(pending).rejects.toThrow('spawn failed')
        await expect(shared.get()).rejects.toThrow('spawn failed')

        expect(createScriptSessionMock).toHaveBeenCalledTimes(1)
    })
})
