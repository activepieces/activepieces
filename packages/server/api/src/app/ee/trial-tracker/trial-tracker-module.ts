import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { licenseKeysService } from '../license-keys/license-keys-service'

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
            await licenseKeysService.checkKeyStatus(false)
        },
    })
}
