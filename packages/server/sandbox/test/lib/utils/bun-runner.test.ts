import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const spawnWithKillMock = vi.fn()

vi.mock('../../../src/lib/utils/exec', () => ({
    spawnWithKill: (params: unknown) => spawnWithKillMock(params),
}))

// eslint-disable-next-line import/first
import { bunRunner } from '../../../src/lib/utils/bun-runner'

function createNoopLog(): ApLogger {
    const log: ApLogger = {
        level: 'silent',
        silent: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return log
}

describe('bunRunner#install', () => {
    let workspace: string

    beforeEach(() => {
        workspace = join(tmpdir(), `bun-runner-test-${randomUUID()}`)
        spawnWithKillMock.mockReset()
        spawnWithKillMock.mockResolvedValue({ stdout: '', stderr: '' })
    })

    afterEach(async () => {
        await rm(workspace, { recursive: true, force: true })
    })

    it('forces the isolated linker so a piece lands in pieces/<name>-<version>/node_modules', async () => {
        await bunRunner(createNoopLog()).install({
            path: workspace,
            filtersPath: ['pieces/@activepieces/piece-a-1.0.0'],
            isolatedLinker: true,
        })

        expect(spawnWithKillMock.mock.calls[0]?.[0].args).toEqual([
            'install',
            '--ignore-scripts',
            '--linker=isolated',
            '--filter',
            './pieces/@activepieces/piece-a-1.0.0',
        ])
    })

    it('leaves the linker at bun\'s default when isolation is not requested', async () => {
        await bunRunner(createNoopLog()).install({
            path: workspace,
            filtersPath: [],
            isolatedLinker: false,
        })

        expect(spawnWithKillMock.mock.calls[0]?.[0].args).toEqual([
            'install',
            '--ignore-scripts',
        ])
    })

    it('rejects a filter path that escapes the workspace', async () => {
        await expect(bunRunner(createNoopLog()).install({
            path: workspace,
            filtersPath: ['../../etc'],
            isolatedLinker: true,
        })).rejects.toThrow('Invalid filter path')
    })
})
