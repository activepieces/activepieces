import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
    getGlobalCachePathLatestVersion,
    getGlobalCacheCommonPath,
    getGlobalCodeCachePath,
    getGlobalCachePiecesPath,
    getGlobalCacheFlowsPath,
    getEnginePath,
    LATEST_CACHE_VERSION,
} from '../../src/lib/cache/cache-paths'

describe('cache-paths', () => {
    it('should use shared directory in latest version path', () => {
        const result = getGlobalCachePathLatestVersion()
        expect(result).toBe(path.resolve('cache', LATEST_CACHE_VERSION, 'shared'))
    })

    it('should return common path under shared directory', () => {
        const result = getGlobalCacheCommonPath()
        expect(result).toBe(path.resolve('cache', LATEST_CACHE_VERSION, 'shared', 'common'))
    })

    it('should return codes path under shared directory', () => {
        const result = getGlobalCodeCachePath()
        expect(result).toBe(path.resolve('cache', LATEST_CACHE_VERSION, 'shared', 'codes'))
    })

    it('should return pieces-metadata path under shared directory', () => {
        const result = getGlobalCachePiecesPath()
        expect(result).toBe(path.resolve('cache', LATEST_CACHE_VERSION, 'shared', 'pieces-metadata'))
    })

    it('should return flows path under shared directory', () => {
        const result = getGlobalCacheFlowsPath()
        expect(result).toBe(path.resolve('cache', LATEST_CACHE_VERSION, 'shared', 'flows'))
    })

    it('should return engine path under common directory', () => {
        const result = getEnginePath()
        expect(result).toBe(path.join(path.resolve('cache', LATEST_CACHE_VERSION, 'shared', 'common'), 'main.js'))
    })
})
