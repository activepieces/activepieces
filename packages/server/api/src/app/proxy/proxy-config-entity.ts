import { ApId, Platform, ProxyConfig } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSON_COLUMN_TYPE } from '../database/database-common'

export type ProxySchema = ProxyConfig & {
    platform: Platform,
}

export const ProxyConfigEntity = new EntitySchema<ProxySchema>({
    name: 'proxy_config',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        defaultHeaders: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
        baseUrl: {
            type: String,
            nullable: false,
        },
        provider: {
            type: String,
            nullable: false,
        }
    },
    indices: [
        { name: 'idx_proxy_config_platform_id_provider', columns: ['platformId', 'provider'], unique: true },
    ],
    relations: { 
        platform: {
            type: "one-to-one",
            target: "platform",
            nullable: false,
            joinColumn: {
                name: "platformId",
                foreignKeyConstraintName: "fk_proxy_config_platform_id",
            },
        },
    },
})