import { Platform, Project, ProxyConfig } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSON_COLUMN_TYPE } from '../database/database-common'

export type ProxySchema = ProxyConfig & {
    project: Project | null,
    platform: Platform
}


export const ProxyConfigEntity = new EntitySchema<ProxySchema>({
    name: 'proxy_config',
    columns: {
        ...BaseColumnSchemaPart,
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
        { name: 'idx_proxy_config_provider', columns: ['provider'] },
        { name: 'idx_proxy_config_project_id', columns: ['project'] },
        { name: 'idx_proxy_config_platform_id', columns: ['platform'] },
    ],
    relations: {
        project: {
            type: "one-to-one",
            target: "project",
            nullable: true,
            joinColumn: {
                name: "project_id",
                foreignKeyConstraintName: "fk_proxy_config_project_id",
            },
        },
        platform: {
            type: "one-to-one",
            target: "platform",
            nullable: false,
            joinColumn: {
                name: "platform_id",
                foreignKeyConstraintName: "fk_proxy_config_platform_id",
            },
        },
    },
})
