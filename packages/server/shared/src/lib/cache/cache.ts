import path from 'path'

export const LATEST_CACHE_VERSION = 'v1'
export const GLOBAL_CACHE_ALL_VERSIONS_PATH = path.resolve('cache')
export const GLOBAL_CACHE_PATH_LATEST_VERSION = path.resolve('cache', LATEST_CACHE_VERSION)
export const GLOBAL_CACHE_COMMON_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'common')
export const GLOBAL_CODE_CACHE_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'codes')
export const ENGINE_PATH = path.join(GLOBAL_CACHE_COMMON_PATH, 'main.js')

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}