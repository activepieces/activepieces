import { ExecutionMode } from '@activepieces/shared'
import { RedisType } from './redis/types'
import { AppSystemProp, PiecesSource, SystemProp } from './system-props'

export enum MigrationType {
    RENAME = 'RENAME',
    VALUE_TRANSFORM = 'VALUE_TRANSFORM',
}

type RenameEnvironmentMigration = {
    type: MigrationType.RENAME
    newProp: SystemProp
    oldProp: string
}

type ValueTransformEnvironmentMigration = {
    type: MigrationType.VALUE_TRANSFORM
    prop: SystemProp
    transform: (value: string) => string | undefined
}

export type EnvironmentMigration = RenameEnvironmentMigration | ValueTransformEnvironmentMigration

let cachedMigrations: EnvironmentMigration[] | null = null

function getEnvironmentMigrations(): EnvironmentMigration[] {
    if (cachedMigrations) {
        return cachedMigrations
    }
    
    cachedMigrations = [
        {
            type: MigrationType.RENAME,
            newProp: AppSystemProp.REDIS_TYPE,
            oldProp: 'QUEUE_MODE',
        },
        {
            type: MigrationType.VALUE_TRANSFORM,
            prop: AppSystemProp.REDIS_TYPE,
            transform: (value: string): RedisType | undefined => {
                if (Object.values(RedisType).includes(value as RedisType)) {
                    return value as RedisType
                }
                if (value === 'REDIS') {
                    return RedisType.STANDALONE
                }
                return undefined
            },
        },
        {
            type: MigrationType.VALUE_TRANSFORM,
            prop: AppSystemProp.PIECES_SOURCE,
            transform: (value: string): PiecesSource | undefined => {
                if (value === 'CLOUD_AND_DB') {
                    return PiecesSource.DB
                }
                return undefined
            },
        },
        {
            type: MigrationType.VALUE_TRANSFORM,
            prop: AppSystemProp.EXECUTION_MODE,
            transform: (value: string): ExecutionMode | undefined => {
                if (value === 'SANDBOXED') {
                    return ExecutionMode.SANDBOX_PROCESS
                }
                return undefined
            },
        },
    ]
    
    return cachedMigrations
}

export function getMigratedEnvironmentValue(prop: SystemProp): string | undefined {
    const envVarName = `AP_${prop}`
    let value = process.env[envVarName]
    
    const migrations = getEnvironmentMigrations()

    if (!value) {
        const renameMigration = migrations.find(
            (m): m is RenameEnvironmentMigration =>
                m.type === MigrationType.RENAME && m.newProp === prop,
        )

        if (renameMigration) {
            const oldEnvVarName = `AP_${renameMigration.oldProp}`
            const oldValue = process.env[oldEnvVarName]
            if (oldValue) {
                value = oldValue
            }
        }
    }

    if (value) {
        const valueTransformMigrations = migrations.filter(
            (m): m is ValueTransformEnvironmentMigration =>
                m.type === MigrationType.VALUE_TRANSFORM && m.prop === prop,
        )

        for (const migration of valueTransformMigrations) {
            const transformedValue = migration.transform(value)
            if (transformedValue !== undefined) {
                value = transformedValue
            }
        }
    }

    return value
}

