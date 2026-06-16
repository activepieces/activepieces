import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { FlowActionType, FlowTriggerType, FlowVersionState } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { functionSourceBuilder } from '../../../../../src/app/workers/function-provisioning/function-source-builder'

const log = { debug() {}, info() {}, warn() {}, error() {} } as never

function makeBaseSource(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'gen2-base-'))
    writeFileSync(path.join(dir, 'index.js'), 'exports.engine = () => {}\n')
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: 'ap-engine-gen2',
        main: 'index.js',
        dependencies: { '@google-cloud/functions-framework': '^3.4.0' },
    }))
    return dir
}

function makeFlowVersion(): never {
    const codeStep = {
        name: 'step_1', displayName: 'Code', type: FlowActionType.CODE, skip: false, valid: true,
        settings: {
            input: {},
            sourceCode: { code: 'exports.code = async () => 42', packageJson: '{"dependencies":{}}' },
            errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
        },
        nextAction: {
            name: 'step_2', displayName: 'Slack', type: FlowActionType.PIECE, skip: false, valid: true,
            settings: { input: {}, pieceName: '@activepieces/piece-slack', pieceVersion: '0.8.0', actionName: 'send', propertySettings: {} },
        },
    }
    return {
        id: 'fv1', created: '', updated: '', flowId: 'f1', displayName: 'F', updatedBy: null, valid: true,
        schemaVersion: null, agentIds: [], state: FlowVersionState.LOCKED, connectionIds: [], backupFiles: null, notes: [],
        trigger: { name: 'trigger', displayName: 'T', valid: true, type: FlowTriggerType.EMPTY, settings: {}, nextAction: codeStep },
    } as never
}

describe('functionSourceBuilder', () => {
    it('bakes code steps and a pieces workspace into the gen2 source', async () => {
        const baseSourceDir = makeBaseSource()
        const staging = await functionSourceBuilder.build({ projectId: 'projbake1', baseSourceDir, flowVersions: [makeFlowVersion()], log })

        // base entry copied
        expect(existsSync(path.join(staging, 'index.js'))).toBe(true)

        // code baked at the layout the engine reads
        const codePath = path.join(staging, 'codes', 'fv1', 'step_1', 'index.js')
        expect(readFileSync(codePath, 'utf-8')).toContain('exports.code')

        // piece baked as a workspace package whose name is the engine's alias
        const piecePkg = JSON.parse(readFileSync(path.join(staging, 'pieces', '@activepieces/piece-slack-0.8.0', 'package.json'), 'utf-8'))
        expect(piecePkg.name).toBe('@activepieces/piece-slack-0.8.0')
        expect(piecePkg.dependencies['@activepieces/piece-slack']).toBe('0.8.0')

        // root package.json declares the workspaces so gen2's buildpack installs them
        const rootPkg = JSON.parse(readFileSync(path.join(staging, 'package.json'), 'utf-8'))
        expect(rootPkg.workspaces).toContain('pieces/**')
        expect(rootPkg.workspaces).toContain('codes/**')
        expect(rootPkg.dependencies['@google-cloud/functions-framework']).toBeDefined()
    })
})
