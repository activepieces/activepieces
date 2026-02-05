import { AppCredential } from '@activepieces/ee-shared'
import { Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

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
            type: 'jsonb',
        },
    },
    indices: [],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            onDelete: 'CASCADE',
            joinColumn: true,
            inverseSide: 'appCredentials',
        },
    },
})
