import { z } from 'zod'

export { RedisType } from '@activepieces/server-utils'

export const RedisConnectionSettings = z.object({
    REDIS_TYPE: z.string(),
    REDIS_SSL_CA_FILE: z.string().optional(),
    REDIS_DB: z.number().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_URL: z.string().optional(),
    REDIS_USER: z.string().optional(),
    REDIS_USE_SSL: z.boolean().optional(),
    REDIS_SENTINEL_ROLE: z.string().optional(),
    REDIS_SENTINEL_HOSTS: z.string().optional(),
    REDIS_SENTINEL_NAME: z.string().optional(),
})

export type RedisConnectionSettings = z.infer<typeof RedisConnectionSettings>
