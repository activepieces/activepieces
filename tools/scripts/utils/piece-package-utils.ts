import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PIECES_ROOT = join(process.cwd(), 'packages', 'pieces')

export function findAllPiecePackageJsons(): string[] {
    const paths: string[] = []
    const dirs = ['community', 'core', 'custom']

    for (const dir of dirs) {
        const dirPath = join(PIECES_ROOT, dir)
        if (!existsSync(dirPath)) {
            continue
        }
        for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                const pkgPath = join(dirPath, entry.name, 'package.json')
                if (existsSync(pkgPath)) {
                    paths.push(pkgPath)
                }
            }
        }
    }

    const commonPkg = join(PIECES_ROOT, 'common', 'package.json')
    if (existsSync(commonPkg)) {
        paths.push(commonPkg)
    }
    const frameworkPkg = join(PIECES_ROOT, 'framework', 'package.json')
    if (existsSync(frameworkPkg)) {
        paths.push(frameworkPkg)
    }

    return paths
}
