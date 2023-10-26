import { EntitySchema } from 'typeorm'
import { AppCredential } from '@activepieces/ee-shared'
import { Project } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

export type AppCredentialSchema = {
    project: Project[]
} & AppCredential

export const AppCredentialEntity = new EntitySchema<AppCredentialSchema>({
    name: 'app_credential',
    columns: {
        ...BaseColumnSchemaPart,
        appName: {
            type: String,
        },
        projectId: ApIdSchema,
        settings: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_app_credentials_projectId_appName',
            columns: ['appName', 'projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            joinColumn: true,
            inverseSide: 'appCredentials',
        },
    },
})
