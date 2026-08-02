import { CodeSandbox } from '../../../src/lib/core/code/code-sandbox-common'
import { noOpCodeSandbox } from '../../../src/lib/core/code/no-op-code-sandbox'
import { v8IsolateCodeSandbox } from '../../../src/lib/core/code/v8-isolate-code-sandbox'

const implementations: [string, CodeSandbox][] = [
    ['noOpCodeSandbox', noOpCodeSandbox],
    ['v8IsolateCodeSandbox', v8IsolateCodeSandbox],
]

describe.each(implementations)('%s createScriptSession', (_name, sandbox) => {
    it('shares the script context across multiple runs', async () => {
        const session = await sandbox.createScriptSession({
            scriptContext: { step_1: { output: { price: 6.4 } } },
            functions: {},
        })
        try {
            expect(await session.run('step_1.output.price')).toBe(6.4)
            expect(await session.run('step_1.output.price + 2')).toBe(8.4)
        }
        finally {
            session.dispose()
        }
    })

    it('makes injected functions available to every run', async () => {
        const session = await sandbox.createScriptSession({
            scriptContext: { value: 3 },
            functions: { double: (n: number) => n * 2 },
        })
        try {
            expect(await session.run('double(value)')).toBe(6)
            expect(await session.run('double(double(value))')).toBe(12)
        }
        finally {
            session.dispose()
        }
    })

    it('evaluates expressions against built-ins', async () => {
        const session = await sandbox.createScriptSession({
            scriptContext: { price: 6.4, items: [5, 'a'] },
            functions: {},
        })
        try {
            expect(await session.run('Math.min(price, 2)')).toBe(2)
            expect(await session.run('items[0]')).toBe(5)
            expect(await session.run('typeof missing === \'undefined\'')).toBe(true)
            await expect(session.run('missing === undefined')).rejects.toThrow()
        }
        finally {
            session.dispose()
        }
    })

    it('rejects runs after dispose', async () => {
        const session = await sandbox.createScriptSession({
            scriptContext: {},
            functions: {},
        })
        session.dispose()
        await expect(session.run('1 + 1')).rejects.toThrow()
    })
})

describe('session parity across implementations', () => {
    it('returns identical values from both implementations for the same scripts', async () => {
        const scriptContext = {
            step_1: { output: { price: 6.4, items: [5, 'a'], user: { name: 'John' } } },
        }
        const scripts = [
            'step_1.output.price',
            'step_1.output.items',
            'step_1.output.user',
            'step_1.output.price > 5',
            'step_1.output.items.length + 1',
            'step_1.output.user.name + \'!\'',
            'step_1.output.nothing === undefined',
        ]
        const noOpSession = await noOpCodeSandbox.createScriptSession({ scriptContext, functions: {} })
        const isolateSession = await v8IsolateCodeSandbox.createScriptSession({ scriptContext, functions: {} })
        try {
            for (const script of scripts) {
                expect(await noOpSession.run(script)).toEqual(await isolateSession.run(script))
            }
        }
        finally {
            noOpSession.dispose()
            isolateSession.dispose()
        }
    })
})
