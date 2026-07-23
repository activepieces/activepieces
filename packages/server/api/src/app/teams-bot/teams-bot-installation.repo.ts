import { apId } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { TeamsBotInstallationEntity } from './teams-bot-installation.entity'

const teamsBotInstallationRepo = repoFactory(TeamsBotInstallationEntity)

export const teamsBotInstallationDb = {
    async upsert({ appId, tenantId, teamsTeamId, serviceUrl }: {
        appId: string
        tenantId: string
        teamsTeamId: string
        serviceUrl: string
    }): Promise<void> {
        await teamsBotInstallationRepo().upsert(
            { id: apId(), appId, tenantId, teamsTeamId, serviceUrl },
            { conflictPaths: ['appId', 'tenantId', 'teamsTeamId'], skipUpdateIfNoValuesChanged: true },
        )
    },

    async findOne({ appId, tenantId, teamsTeamId }: {
        appId: string
        tenantId: string
        teamsTeamId: string
    }) {
        return teamsBotInstallationRepo().findOneBy({ appId, tenantId, teamsTeamId })
    },

    async remove({ appId, tenantId, teamsTeamId }: {
        appId: string
        tenantId: string
        teamsTeamId: string
    }): Promise<void> {
        await teamsBotInstallationRepo().delete({ appId, tenantId, teamsTeamId })
    },
}
