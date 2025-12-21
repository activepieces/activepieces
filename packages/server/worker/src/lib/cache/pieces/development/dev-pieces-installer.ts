import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { filePiecesUtils, spawnWithKill } from '@activepieces/server-shared'
import chalk from 'chalk'
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


export const devPiecesInstaller = (log: FastifyBaseLogger) => {
    const utils = filePiecesUtils(log)

    async function installPiecesDependencies(packageNames: string[]): Promise<void> {
        const deps = new Set<string>()

        for (const packageName of packageNames) {
            const folderPath = await utils.findSourcePiecePathByPieceName(packageName)
            if (!folderPath) continue

            const pieceDependencies = await utils.getPieceDependencies(folderPath)
            if (!pieceDependencies) continue

            Object.keys(pieceDependencies).forEach((key) => deps.add(`${key}@${pieceDependencies[key as keyof typeof pieceDependencies]}`))
        }

        if (deps.size > 0) {
            log.info(chalk.yellow(`Installing Pieces Dependencies: ${Array.from(deps).join(' ')}`))
            await spawnWithKill({ cmd: `bun install ${Array.from(deps).join(' ')} --no-save --silent`, printOutput: true })
        }
    }
 
    async function linkSharedActivepiecesPackagesToPiece(packageName: string) {
        const packagePath = await utils.findDistPiecePathByPackageName(packageName)
        if (!packagePath) {
            log.error({ packageName }, 'Could not find dist path for package')
            return
        }

        const dependencies = await utils.getPieceDependencies(packagePath)

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
    }

    async function initSharedPackagesLinks() {
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
    }

    async function linkSharedActivepiecesPackagesToEachOther() {
        await initSharedPackagesLinks()

        const packages = sharedPiecesPackages()
        const packageNames = Object.keys(packages)

        for (const [packageName, pkg] of Object.entries(packages)) {
            // Get dependencies for this shared package
            const dependencies = await utils.getPieceDependencies(pkg.path)
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
    }

    return {
        installPiecesDependencies,
        linkSharedActivepiecesPackagesToPiece,
        linkSharedActivepiecesPackagesToEachOther,
    }
}
