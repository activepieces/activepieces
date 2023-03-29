import fs from 'fs';
import {codeBuilder} from '../../../src/app/workers/code-worker/code-builder';
import SandboxManager, {Sandbox} from '../../../src/app/workers/sandbox';

describe('Code Builder', () => {

    test('Build Code Successfully', async () => {
        jest
            .spyOn(SandboxManager.prototype, 'obtainSandbox')
            .mockImplementation(() => new Sandbox(1));
        const resourceFile = fs.readFileSync('test/resources/simple-code.zip');
        const bundledJs = await codeBuilder.build(resourceFile);
        expect(bundledJs.toString('utf-8')).toEqual('module.exports={code:async e=>!0};');
    });

    test('Build Code with Compilation Error', async () => {
        jest
            .spyOn(SandboxManager.prototype, 'obtainSandbox')
            .mockImplementation(() => new Sandbox(2));
        const resourceFile = fs.readFileSync('test/resources/compilation-error.zip');
        const bundledJs = await codeBuilder.build(resourceFile);
        expect(bundledJs.toString('utf-8')).toMatch(/(1 error)/);
    });

});
