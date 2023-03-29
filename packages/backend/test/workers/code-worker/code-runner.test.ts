import fs from 'fs'
import {codeRunner} from '../../../src/app/workers/code-worker/code-runner'
import SandboxManager, {Sandbox} from '../../../src/app/workers/sandbox'

describe('Code Runner', () => {
    test('Running Code Successfully', async () => {
        jest
            .spyOn(SandboxManager.prototype, 'obtainSandbox')
            .mockImplementation(() => new Sandbox(3))
        const resourceFile = fs.readFileSync('test/resources/simple-code.zip')
        const bundledJs = await codeRunner.run(resourceFile, {})
        bundledJs.timeInSeconds = 1.0
        expect(bundledJs).toEqual({
            verdict: 'OK',
            timeInSeconds: 1.0,
            output: 'true',
            standardOutput: '',
            standardError: '',
        },
        )
    })

    test('Running Code With compilation error', async () => {
        jest
            .spyOn(SandboxManager.prototype, 'obtainSandbox')
            .mockImplementation(() => new Sandbox(4))
        const resourceFile = fs.readFileSync('test/resources/compilation-error.zip')
        const bundledJs = await codeRunner.run(resourceFile, {})
        bundledJs.timeInSeconds = 1.0
        bundledJs.standardError = 'ERROR_MESSAGE'
        expect(bundledJs).toEqual(
            {
                verdict: 'RUNTIME_ERROR',
                timeInSeconds: 1.0,
                standardOutput: '',
                standardError: 'ERROR_MESSAGE',
            })
    })
})
