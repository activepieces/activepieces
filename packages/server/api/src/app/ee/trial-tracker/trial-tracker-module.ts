import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { platformService } from '../../platform/platform.service'
import { activationKeysService } from '../activation-keys/activation-keys-service'

export const trialTrackerModule: FastifyPluginAsyncTypebox = async () => {
    await systemJobsSchedule.upsertJob({
        job: {
            name: 'usage-report',
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
        async handler() {
            const oldestPlatform = await platformService.getOldestPlatform()
            if (!oldestPlatform || !oldestPlatform.activationKey) {
                return
            }
            //Need to make key return features as well and validate without throwing an error if key doesn't exist
            const key = await activationKeysService.getKeyRow({ key: oldestPlatform.activationKey })
            if (key.isTrial) {
                const expirationDate = new Date(key.expires_at).getTime()
                const today = new Date().getTime()
                if (today > expirationDate) {
                    await platformService.update({
                        id: oldestPlatform.id,
                        alertsEnabled: false,
                        apiKeysEnabled: false,
                        auditLogEnabled: false,
                        customAppearanceEnabled: false,
                        ssoEnabled: false,
                        managePiecesEnabled: false,
                        manageProjectsEnabled: false,
                        manageTemplatesEnabled: false,
                        gitSyncEnabled: false,
                        showPoweredBy: false,
                        customDomainsEnabled: false,
                        projectRolesEnabled: false,
                        flowIssuesEnabled: false,                        
                    })
                }
            }
            else {
                await platformService.update({
                    id: oldestPlatform.id,
                    alertsEnabled: true,
                    apiKeysEnabled: true,
                    auditLogEnabled: true,
                    customAppearanceEnabled: true,
                    ssoEnabled: true,
                    managePiecesEnabled: true,
                    manageProjectsEnabled: true,
                    manageTemplatesEnabled: true,
                    gitSyncEnabled: true,
                    showPoweredBy: true,
                    customDomainsEnabled: true,
                    projectRolesEnabled: true,
                    flowIssuesEnabled: true,                        
                })
            }
        },
    })
}
