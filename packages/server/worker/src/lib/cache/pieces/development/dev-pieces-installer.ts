import { mkdir, symlink, rm, readlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { cwd } from 'node:process'
import { filePiecesUtils } from '@activepieces/server-shared'
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

async function createSymlink(target: string, linkPath: string, log: FastifyBaseLogger): Promise<void> {
    try {
        // Ensure parent directory exists
        await mkdir(dirname(linkPath), { recursive: true })

        // Check if symlink already exists and points to correct target
        try {
            const existingTarget = await readlink(linkPath)
            if (existingTarget === target) {
                return // Already linked correctly
            }
            // Remove existing symlink if it points elsewhere
            await rm(linkPath, { force: true })
        }
        catch {
            // Symlink doesn't exist, that's fine
        }

        // Create symlink (use 'dir' type for directories)
        await symlink(target, linkPath, 'dir')
        log.info({ target, linkPath }, 'Created symlink')
    }
    catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        log.error({ target, linkPath, error: errorMessage }, 'Error creating symlink')
    }
}

export const devPiecesInstaller = (log: FastifyBaseLogger) => ({
    linkSharedActivepiecesPackagesToPiece: async (packageName: string): Promise<void> => {
        const packagePath = await filePiecesUtils(log).findDistPiecePathByPackageName(packageName)
        if (!packagePath) {
            log.error({ packageName }, 'Could not find dist path for package')
            return
        }

        const dependencies = await filePiecesUtils(log).getPieceDependencies(packagePath)
        const sharedPackages = sharedPiecesPackages()

        const apDependencies = Object.keys(dependencies ?? {}).filter(dep => dep.startsWith('@activepieces/') && packageName !== dep)

        for (const dependency of apDependencies) {
            const sharedPkg = sharedPackages[dependency]
            if (sharedPkg) {
                const linkPath = resolve(packagePath, 'node_modules', dependency)
                await createSymlink(sharedPkg.path, linkPath, log)
            }
        }
    },

    initSharedPackagesLinks: async (): Promise<void> => {
        // No-op: Direct symlinks don't require initialization
    },

    linkSharedActivepiecesPackagesToEachOther: async (): Promise<void> => {
        const packages = sharedPiecesPackages()
        const packageNames = Object.keys(packages)

        for (const [packageName, pkg] of Object.entries(packages)) {
            const dependencies = await filePiecesUtils(log).getPieceDependencies(pkg.path)
            const apDependencies = Object.keys(dependencies ?? {}).filter(
                dep => dep.startsWith('@activepieces/') && packageName !== dep && packageNames.includes(dep),
            )

            for (const dependency of apDependencies) {
                const sharedPkg = packages[dependency]
                if (sharedPkg) {
                    const linkPath = resolve(pkg.path, 'node_modules', dependency)
                    await createSymlink(sharedPkg.path, linkPath, log)
                }
            }
        }
    },
})
