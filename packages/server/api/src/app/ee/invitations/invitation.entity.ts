import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { UserInvitation } from '@activepieces/ee-shared'

export const UserInvitationEntity = new EntitySchema<UserInvitation>({
    name: 'project_member',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        platformRole: {
            type: String,
        },
        email: {
            type: String,
        },
        projectId: {
            type: String,
            nullable: true,
        },
        projectRole: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_user_invitation_email_platform_project',
            columns: ['email', 'platformId', 'projectId'],
            unique: true,
        },
    ],
    relations: {
    },
})
