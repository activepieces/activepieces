import { realpathSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'esbuild'

function isPathInside(candidate: string, root: string): boolean {
    return candidate === root || candidate.startsWith(root + path.sep)
}

function isRealpathInside(candidate: string, root: string): boolean {
    try {
        return isPathInside(realpathSync(candidate), root)
    }
    catch {
        return false
    }
}

function isBareSpecifier(specifier: string): boolean {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('\\')) {
        return false
    }
    if (path.isAbsolute(specifier)) {
        return false
    }
    return !/^[a-z][a-z0-9+.-]*:/i.test(specifier)
}

export function stepFolderResolvePlugin(rootDir: string): Plugin {
    const root = realpathSync(rootDir)
    return {
        name: 'ap-filesystem-jail',
        setup(build): void {
            build.onResolve({ filter: /.*/ }, (args) => {
                if (args.kind === 'entry-point' || isBareSpecifier(args.path)) {
                    return null
                }
                if (/^[a-z][a-z0-9+.-]*:/i.test(args.path)) {
                    return { errors: [{ text: IMPORT_OUT_OF_SCOPE_MESSAGE }] }
                }
                const base = args.resolveDir === '' ? root : args.resolveDir
                const target = path.resolve(base, args.path)
                if (!isPathInside(target, root)) {
                    return { errors: [{ text: IMPORT_OUT_OF_SCOPE_MESSAGE }] }
                }
                return null
            })
            build.onLoad({ filter: /.*/ }, (args) => {
                if (!isRealpathInside(args.path, root)) {
                    return { errors: [{ text: IMPORT_OUT_OF_SCOPE_MESSAGE }] }
                }
                return null
            })
        },
    }
}

export const IMPORT_OUT_OF_SCOPE_MESSAGE = 'Importing files outside the step folder is not allowed'
