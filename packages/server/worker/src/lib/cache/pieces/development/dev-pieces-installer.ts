import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { filePiecesUtils, spawnWithKill } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'

const baseDistPath = resolve(cwd(), 'dist', 'packages')
const sharedPiecesPackages = () => {
    const packages: Record<string, { path: string }> = {
        '@activepieces/pieces-framework': {
            path: resolve(baseDistPath, 'pieces', 'community', 'framework'),
        },
        '@activepieces/pieces-common': {
            path: resolve(baseDistPath, 'pieces', 'community', 'common'),
        },
        '@activepieces/shared': {
            path: resolve(cwd(), 'dist', 'packages', 'shared'),
        },
    }

    return packages
}


export const devPiecesInstaller = (log: FastifyBaseLogger) => ({
    linkSharedActivepiecesPackagesToPiece: async (packageName: string): Promise<void> => {
        const packagePath = await filePiecesUtils(log).findDistPiecePathByPackageName(packageName)
        if (!packagePath) {
            log.error({ packageName }, 'Could not find dist path for package')
            return
        }

        const dependencies = await filePiecesUtils(log).getPieceDependencies(packagePath)

        const apDependencies = Object.keys(dependencies ?? {}).filter(dep => dep.startsWith('@activepieces/') && packageName !== dep)

        for (const dependency of apDependencies) {
            try {
                await spawnWithKill({ cmd: `bun link --cwd ${packagePath} --save ${dependency} --quiet`, printOutput: true })
            }
            catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e)
                log.error({
                    name: 'linkSharedActivepiecesPackagesToPiece',
                    packageName,
                    dependency,
                    packagePath,
                    error: errorMessage,
                }, 'Error linking dependency to piece (non-fatal)')
            }
        }
    },

    initSharedPackagesLinks: async (): Promise<void> => {
        const packages = sharedPiecesPackages()
        for (const [name, pkg] of Object.entries(packages)) {
            try {
                await spawnWithKill({ cmd: `bun link --cwd ${pkg.path} --quiet`, printOutput: true })
            }
            catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e)
                log.error({
                    name: 'initSharedPackagesLinks',
                    packageName: name,
                    path: pkg.path,
                    error: errorMessage,
                }, 'Error initializing shared package link (non-fatal)')
            }
        }
    },

    linkSharedActivepiecesPackagesToEachOther: async (): Promise<void> => {
        await devPiecesInstaller(log).initSharedPackagesLinks()

        const packages = sharedPiecesPackages()
        const packageNames = Object.keys(packages)

        for (const [packageName, pkg] of Object.entries(packages)) {
            const dependencies = await filePiecesUtils(log).getPieceDependencies(pkg.path)
            const apDependencies = Object.keys(dependencies ?? {}).filter(
                dep => dep.startsWith('@activepieces/') && packageName !== dep && packageNames.includes(dep),
            )

            for (const dependency of apDependencies) {
                try {
                    await spawnWithKill({ cmd: `bun link --cwd ${pkg.path} --save ${dependency} --quiet`, printOutput: true })
                }
                catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : String(e)
                    log.error({
                        name: 'linkSharedActivepiecesPackagesToEachOther',
                        packageName,
                        dependency,
                        path: pkg.path,
                        error: errorMessage,
                    }, 'Error linking shared packages to each other')
                }
            }
        }
    },
})
