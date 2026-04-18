import path from 'node:path'
import { build } from 'esbuild'

export async function bundleSsrfGuard({ outfile }: { outfile: string }): Promise<void> {
    const entryPoint = path.resolve(__dirname, '../../../../engine/src/lib/network/ssrf-guard.ts')
    const sharedSrc = path.resolve(__dirname, '../../../../../shared/src')
    await build({
        entryPoints: [entryPoint],
        outfile,
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        logLevel: 'silent',
        alias: {
            '@activepieces/shared': sharedSrc,
        },
    })
}
