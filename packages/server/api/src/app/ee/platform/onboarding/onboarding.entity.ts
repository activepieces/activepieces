import { OnboardingStep } from '@activepieces/ee-shared'
import { Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type OnboardingEntitySchema = {
    platform: Platform
    platformId: string
    step: OnboardingStep
}

export const OnboardingEntity = new EntitySchema<OnboardingEntitySchema>({
    name: 'onboarding',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        step: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_onboarding_platform_id_step',
            columns: ['platformId', 'step'],
            unique: true,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_onboarding_platform_id',
            },
        },
    },
})
