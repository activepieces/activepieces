import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

// ponytail: intentionally global — NOT scoped by projectId/platformId.
// A row is created by Microsoft's installationUpdate webhook, where no AP session
// exists; it is keyed by Azure identity (appId/tenantId/teamsTeamId) and holds only
// the Microsoft serviceUrl (routing state, not a secret). The capability to send is
// the appSecret, re-verified by Microsoft on every token mint — not any row here.
// The same Azure bot shared across projects SHOULD map to one installation row.
type TeamsBotInstallationSchema = {
    id: string
    appId: string
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
        appId: {
            type: String,
            length: 255,
            nullable: false,
        },
        tenantId: {
            type: String,
            length: 255,
            nullable: false,
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
            columns: ['appId', 'tenantId', 'teamsTeamId'],
        },
    ],
})
