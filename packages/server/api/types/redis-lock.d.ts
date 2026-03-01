declare module 'redis-lock' {
    function redisLock(
        client: unknown,
        retryDelay: number
    ): (lockId: string) => Promise<() => Promise<void>>
    export default redisLock
}
