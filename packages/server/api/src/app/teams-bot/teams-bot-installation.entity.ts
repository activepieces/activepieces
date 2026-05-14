import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type TeamsBotInstallationSchema = {
    id: string
    tenantId: string
    teamsTeamId: string
    serviceUrl: string
    created: Date
    updated: Date
}

export const TeamsBotInstallationEntity = new EntitySchema<TeamsBotInstallationSchema>({
    name: 'teams_bot_installation',
    columns: {
        ...BaseColumnSchemaPart,
        tenantId: {
            ...ApIdSchema,
            type: String,
            length: 255,
        },
        teamsTeamId: {
            type: String,
            length: 255,
        },
        serviceUrl: {
            type: String,
            length: 512,
        },
    },
    uniques: [
        {
            columns: ['tenantId', 'teamsTeamId'],
        },
    ],
})
