import { SignUpMethod, User } from '@activepieces/shared'
import { EntitySchema, EntitySchemaColumnOptions } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

const nullableText: EntitySchemaColumnOptions = {
    type: String,
    nullable: true,
}

export const UserAttributionEntity = new EntitySchema<UserAttributionSchema>({
    name: 'user_attribution',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        platformId: {
            ...ApIdSchema,
            nullable: true,
        },
        identityId: {
            ...ApIdSchema,
            nullable: true,
        },
        method: {
            type: String,
            nullable: false,
        },
        sessionId: nullableText,
        utmSource: nullableText,
        utmMedium: nullableText,
        utmCampaign: nullableText,
        utmTerm: nullableText,
        utmContent: nullableText,
        gclid: nullableText,
        fbclid: nullableText,
        ref: nullableText,
        apCta: nullableText,
        landingPath: nullableText,
        referrer: nullableText,
    },
    indices: [
        {
            name: 'idx_user_attribution_user_id',
            columns: ['userId'],
            unique: true,
        },
        {
            name: 'idx_user_attribution_identity_id',
            columns: ['identityId'],
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_user_attribution_user_id',
            },
        },
    },
})

export type UserAttribution = {
    id: string
    created: string
    updated: string
    userId: string | null
    platformId: string | null
    identityId: string | null
    method: SignUpMethod
    sessionId: string | null
    utmSource: string | null
    utmMedium: string | null
    utmCampaign: string | null
    utmTerm: string | null
    utmContent: string | null
    gclid: string | null
    fbclid: string | null
    ref: string | null
    apCta: string | null
    landingPath: string | null
    referrer: string | null
}

export type UserAttributionSchema = UserAttribution & {
    user?: User
}
