import { KeyPairAlgorithm, ManagedAuthnKeyPair, Platform } from '@activepieces/ee-shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'
import { User } from '@activepieces/shared'

type ManagedAuthnKeyPairSchema = ManagedAuthnKeyPair & {
    platform: Platform
    generator: User
}

export const ManagedAuthnKeyPairEntity = new EntitySchema<ManagedAuthnKeyPairSchema>({
    name: 'managed_authn_key_pair',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        publicKey: {
            type: String,
            nullable: false,
        },
        algorithm: {
            type: String,
            enum: KeyPairAlgorithm,
            nullable: false,
        },
        generatedBy: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_managed_authn_key_pair_platform_id',
            },
        },
        generator: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'generatedBy',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_managed_authn_key_pair_generated_by',
            },
        },
    },
})
