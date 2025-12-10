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
        if (!packagePath) return

        const dependencies = await utils.getPieceDependencies(packagePath)

        const apDependencies = Object.keys(dependencies ?? {}).filter(dep => dep.startsWith('@activepieces/') && packageName !== dep)

        apDependencies.forEach(async (dependency) => {
            await spawnWithKill({ cmd: `bun link --cwd ${packagePath} --save ${dependency} --quiet`, printOutput: true }).catch(e => {
                log.error({
                    name: 'linkSharedActivepiecesPackagesToPiece',
                    message: JSON.stringify(e),
                }, 'Error linking shared activepieces packages to piece')
            })
        })
    }

    async function initSharedPackagesLinks() {
        await Promise.all(Object.values(sharedPiecesPackages()).map(pkg => 
            spawnWithKill({ cmd: `bun link --cwd ${pkg.path} --quiet`, printOutput: true }).catch(e => {
                log.error({
                    name: 'initSharedPackagesLinks',
                    message: JSON.stringify(e),
                }, 'Error initializing shared packages links')
            }),
        ))
    }

    async function linkSharedActivepiecesPackagesToEachOther() {
        await initSharedPackagesLinks()

        const noneRegisteryPackages = sharedPiecesPackages()

        const noneRegisteryPackagesKeys = Object.keys(noneRegisteryPackages)

        noneRegisteryPackagesKeys.forEach(async key => linkSharedActivepiecesPackagesToPiece(key))
    }

    return {
        installPiecesDependencies,
        linkSharedActivepiecesPackagesToPiece,
        linkSharedActivepiecesPackagesToEachOther,
    }
}
