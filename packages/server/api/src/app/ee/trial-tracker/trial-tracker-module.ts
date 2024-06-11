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
            await activationKeysService.checkActivationKeyStatus(false)
        },
    })
}
