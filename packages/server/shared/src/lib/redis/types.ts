import { Static, Type } from '@sinclair/typebox'


export enum RedisType {
    SENTINEL = 'SENTINEL',
    MEMORY = 'MEMORY',
    STANDALONE = 'STANDALONE',
}


export enum QueueMode {
    REDIS = 'REDIS',
    MEMORY = 'MEMORY',
}


export const RedisConnectionSettings = Type.Object({
    REDIS_TYPE: Type.String(),
    REDIS_SSL_CA_FILE: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_DB: Type.Union([Type.Number(), Type.Undefined()]),
    REDIS_HOST: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_PASSWORD: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_PORT: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_URL: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_USER: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_USE_SSL: Type.Union([Type.Boolean(), Type.Undefined()]),
    REDIS_SENTINEL_ROLE: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_SENTINEL_HOSTS: Type.Union([Type.String(), Type.Undefined()]),
    REDIS_SENTINEL_NAME: Type.Union([Type.String(), Type.Undefined()]),
})

export type RedisConnectionSettings = Static<typeof RedisConnectionSettings>
