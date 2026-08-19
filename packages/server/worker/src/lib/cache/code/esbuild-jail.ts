import { realpathSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'esbuild'

const SCHEME_REGEX = /^[a-z][a-z0-9+.-]*:/i

const ALLOWED_SCHEMES = ['node:']

function isPathInside({ candidate, root }: { candidate: string, root: string }): boolean {
    return candidate === root || candidate.startsWith(root + path.sep)
}

function isRealpathInside({ candidate, root }: { candidate: string, root: string }): boolean {
    try {
        return isPathInside({ candidate: realpathSync(candidate), root })
    }
    catch {
        return false
    }
}

function hasAllowedScheme(specifier: string): boolean {
    return ALLOWED_SCHEMES.some((scheme) => specifier.toLowerCase().startsWith(scheme))
}

function isBareSpecifier(specifier: string): boolean {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('\\')) {
        return false
    }
    if (path.isAbsolute(specifier)) {
        return false
    }
    return !SCHEME_REGEX.test(specifier)
}

export function esbuildJail(rootDir: string): Plugin {
    const root = realpathSync(rootDir)
    return {
        name: 'ap-esbuild-jail',
        setup(build): void {
            build.onResolve({ filter: /.*/ }, (args) => {
                if (args.kind === 'entry-point' || hasAllowedScheme(args.path) || isBareSpecifier(args.path)) {
                    return null
                }
                if (SCHEME_REGEX.test(args.path)) {
                    return { errors: [{ text: OUTSIDE_STEP_FOLDER_MESSAGE }] }
                }
                const base = args.resolveDir === '' ? root : args.resolveDir
                if (!isPathInside({ candidate: path.resolve(base, args.path), root })) {
                    return { errors: [{ text: OUTSIDE_STEP_FOLDER_MESSAGE }] }
                }
                return null
            })
            build.onLoad({ filter: /.*/ }, (args) => {
                if (!isRealpathInside({ candidate: args.path, root })) {
                    return { errors: [{ text: OUTSIDE_STEP_FOLDER_MESSAGE }] }
                }
                return null
            })
        },
    }
}

export const OUTSIDE_STEP_FOLDER_MESSAGE = 'Importing files outside the step folder is not allowed'
