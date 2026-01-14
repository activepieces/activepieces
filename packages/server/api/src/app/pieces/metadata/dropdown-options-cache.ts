import { AppSystemProp } from '@activepieces/server-shared'
import { AUTHENTICATION_PROPERTY_NAME, isNil, PieceOptionRequest } from '@activepieces/shared'
import { createHash } from 'crypto'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock, distributedStore } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { EngineHelperPropResult } from 'server-worker'

/**
 * Default TTL for dropdown options cache in seconds (5 minutes)
 */
const DEFAULT_CACHE_TTL_SECONDS = 300

/**
 * TTL for search results (30 seconds) - shorter to ensure more accurate search results
 */
const SEARCH_CACHE_TTL_SECONDS = 30

/**
 * Lock timeout for cache stampede protection (30 seconds)
 */
const LOCK_TIMEOUT_SECONDS = 30

/**
 * Cache key prefix for dropdown options
 */
const CACHE_KEY_PREFIX = 'dropdown_options'

/**
 * Generate a deterministic hash for the input object
 * Includes the auth connection to ensure user-specific data is properly isolated
 */
function hashInput(input: Record<string, unknown>): string {
    const serialized = JSON.stringify(input, Object.keys(input).sort())
    return createHash('sha256').update(serialized).digest('hex').substring(0, 16)
}

/**
 * Extract connection ID from input for user-specific cache isolation
 * The auth property contains the connection reference which is unique per user's OAuth connection
 */
function extractConnectionId(input: Record<string, unknown>): string {
    const auth = input[AUTHENTICATION_PROPERTY_NAME]
    if (typeof auth === 'string' && auth.length > 0) {
        // Hash the connection reference to keep cache key manageable
        return createHash('sha256').update(auth).digest('hex').substring(0, 8)
    }
    return 'no-auth'
}

/**
 * Generate a unique cache key for dropdown options
 * Includes connection ID to ensure user-specific dropdown data is properly isolated
 */
function generateCacheKey(params: PieceOptionRequest, platformId: string): string {
    const inputHash = hashInput(params.input)
    const connectionId = extractConnectionId(params.input)
    const searchPart = params.searchValue ? `:search:${params.searchValue}` : ''
    
    return [
        CACHE_KEY_PREFIX,
        platformId,
        params.pieceName,
        params.pieceVersion,
        params.actionOrTriggerName,
        params.propertyName,
        connectionId,  // User-specific isolation
        inputHash,
    ].join(':') + searchPart
}

/**
 * Get the configured TTL for dropdown options cache
 */
function getCacheTTL(hasSearchValue: boolean): number {
    if (hasSearchValue) {
        return SEARCH_CACHE_TTL_SECONDS
    }
    const configuredTTL = system.getNumber(AppSystemProp.DROPDOWN_CACHE_TTL_SECONDS)
    return configuredTTL ?? DEFAULT_CACHE_TTL_SECONDS
}

/**
 * Dropdown options cache service for caching piece dropdown options
 * to avoid repeated API calls to external services.
 * 
 * Features:
 * - Cache stampede protection using distributed locks
 * - User-specific isolation via connection ID in cache key
 * - Configurable TTL with shorter TTL for search queries
 */
export const dropdownOptionsCache = (log: FastifyBaseLogger) => ({
    /**
     * Get cached dropdown options
     * @param params - The piece option request parameters
     * @param platformId - The platform ID for isolation
     * @returns Cached result or null if not found
     */
    async get(params: PieceOptionRequest, platformId: string): Promise<EngineHelperPropResult | null> {
        const cacheKey = generateCacheKey(params, platformId)
        
        const cachedResult = await distributedStore.get<EngineHelperPropResult>(cacheKey)
        
        if (!isNil(cachedResult)) {
            log.debug({
                cacheKey,
                pieceName: params.pieceName,
                propertyName: params.propertyName,
            }, '[dropdownOptionsCache] Cache hit for dropdown options')
        }
        
        return cachedResult
    },

    /**
     * Store dropdown options in cache
     * @param params - The piece option request parameters
     * @param platformId - The platform ID for isolation
     * @param result - The result to cache
     */
    async set(params: PieceOptionRequest, platformId: string, result: EngineHelperPropResult): Promise<void> {
        const cacheKey = generateCacheKey(params, platformId)
        const ttl = getCacheTTL(!isNil(params.searchValue))
        
        await distributedStore.put(cacheKey, result, ttl)
        
        log.debug({
            cacheKey,
            pieceName: params.pieceName,
            propertyName: params.propertyName,
            ttl,
        }, '[dropdownOptionsCache] Cached dropdown options')
    },

    /**
     * Get cached result or execute fetcher with cache stampede protection.
     * Uses distributed locking to ensure only ONE request fetches data while 
     * others wait, preventing the thundering herd problem.
     * 
     * @param params - The piece option request parameters
     * @param platformId - The platform ID for isolation
     * @param fetcher - Function to fetch data on cache miss
     * @returns Cached or freshly fetched result
     */
    async getOrSet(
        params: PieceOptionRequest,
        platformId: string,
        fetcher: () => Promise<EngineHelperPropResult>,
    ): Promise<EngineHelperPropResult> {
        const cacheKey = generateCacheKey(params, platformId)
        
        // Check cache first
        const cachedResult = await distributedStore.get<EngineHelperPropResult>(cacheKey)
        if (!isNil(cachedResult)) {
            log.debug({
                cacheKey,
                pieceName: params.pieceName,
                propertyName: params.propertyName,
            }, '[dropdownOptionsCache] Cache hit')
            return cachedResult
        }
        
        // Cache miss - use distributed lock to prevent stampede
        const lockKey = `lock:${cacheKey}`
        
        return distributedLock(log).runExclusive({
            key: lockKey,
            timeoutInSeconds: LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                // Double-check cache after acquiring lock (another request may have populated it)
                const recheckedResult = await distributedStore.get<EngineHelperPropResult>(cacheKey)
                if (!isNil(recheckedResult)) {
                    log.debug({
                        cacheKey,
                    }, '[dropdownOptionsCache] Cache hit after lock acquisition')
                    return recheckedResult
                }
                
                // Fetch fresh data
                log.debug({
                    cacheKey,
                    pieceName: params.pieceName,
                    propertyName: params.propertyName,
                }, '[dropdownOptionsCache] Cache miss, fetching fresh data')
                
                const result = await fetcher()
                
                // Store in cache
                const ttl = getCacheTTL(!isNil(params.searchValue))
                await distributedStore.put(cacheKey, result, ttl)
                
                log.debug({
                    cacheKey,
                    ttl,
                }, '[dropdownOptionsCache] Cached fresh result')
                
                return result
            },
        })
    },

    /**
     * Generate the cache key (exposed for testing)
     */
    generateCacheKey,
})
