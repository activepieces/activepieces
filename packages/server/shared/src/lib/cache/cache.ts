import path from 'path'

export const GLOBAL_CACHE_PATH = path.resolve('cache')
export const GLOBAL_CACHE_COMMON_PATH = path.resolve('cache', 'common')
export const GLOBAL_CODE_CACHE_PATH = path.resolve('cache', 'codes')
export const ENGINE_PATH = path.join(GLOBAL_CACHE_COMMON_PATH, 'main.js')

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}