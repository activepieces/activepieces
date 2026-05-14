import { apId } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { TeamsBotInstallationEntity } from './teams-bot-installation.entity'

const teamsBotInstallationRepo = repoFactory(TeamsBotInstallationEntity)

export const teamsBotInstallationDb = {
    async upsert({ tenantId, teamsTeamId, serviceUrl }: {
        tenantId: string
        teamsTeamId: string
        serviceUrl: string
    }): Promise<void> {
        await teamsBotInstallationRepo().upsert(
            { id: apId(), tenantId, teamsTeamId, serviceUrl },
            { conflictPaths: ['tenantId', 'teamsTeamId'], skipUpdateIfNoValuesChanged: true },
        )
    },

    async findOne({ tenantId, teamsTeamId }: {
        tenantId: string
        teamsTeamId: string
    }) {
        return teamsBotInstallationRepo().findOneBy({ tenantId, teamsTeamId })
    },
}
