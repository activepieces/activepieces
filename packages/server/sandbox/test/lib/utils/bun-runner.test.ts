import { ApLogger } from '@activepieces/server-utils'
import { describe, expect, it, vi } from 'vitest'

const spawnMock = vi.fn().mockResolvedValue({ stdOut: '', stdError: '' })

vi.mock('../../../src/lib/utils/exec', () => ({
    spawnWithKill: (params: unknown) => spawnMock(params),
}))

// eslint-disable-next-line import/first
import { bunRunner } from '../../../src/lib/utils/bun-runner'

const fakeLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as ApLogger

describe('bunRunner.build', () => {
    it('bundles a code step self-contained and tree-shaken, matching how pieces are built', async () => {
        spawnMock.mockClear()

        await bunRunner(fakeLog).build({ path: '/tmp/step', entryFile: '/tmp/step/index.ts', outputFile: '/tmp/step/index.js' })

        const { cmd, args } = spawnMock.mock.calls[0][0] as { cmd: string, args: string[] }
        expect(cmd).toBe('esbuild')
        expect(args).toContain('--bundle')
        expect(args).toContain('--minify')
        expect(args).toContain('--tree-shaking=true')
        expect(args).toContain('--keep-names')
        expect(args).toContain('--platform=node')
        expect(args).toContain('--format=cjs')
        expect(args.some((arg) => arg.startsWith('--external'))).toBe(false)
    })
})
