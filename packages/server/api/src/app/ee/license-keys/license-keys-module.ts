import { system, SystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { platformService } from '../../platform/platform.service'
import { licenseKeysController } from './license-keys-controller'
import { licenseKeysService } from './license-keys-service'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'

export const licenseKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await systemJobsSchedule.upsertJob({
        job: {
            name: SystemJobName.TRIAL_TRACKER,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
    })
    await app.register(licenseKeysController, { prefix: '/v1/license-keys' })
}

async function licenseKeyJobHandler(): Promise<void> {
    const platform = await platformService.getOldestPlatform()
    if (isNil(platform)) {
        return
    }
    await licenseKeysService.verifyKeyAndApplyLimits({
        platformId: platform.id,
        license: system.get<string>(SystemProp.LICENSE_KEY),
    })
}

systemJobHandlers.registerJobHandler(SystemJobName.TRIAL_TRACKER, licenseKeyJobHandler)