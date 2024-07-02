import { AppSystemProp, system } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { platformService } from '../../platform/platform.service'
import { licenseKeysController } from './license-keys-controller'
import { licenseKeysService } from './license-keys-service'

export const licenseKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await systemJobsSchedule.upsertJob({
        job: {
            name: 'trial-tracker',
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
        async handler() {
            const platform = await platformService.getOldestPlatform()
            if (isNil(platform)) {
                return
            }
            await licenseKeysService.verifyKeyAndApplyLimits({
                platformId: platform.id,
                license: system.get<string>(AppSystemProp.LICENSE_KEY),
            })
        },
    })
    await app.register(licenseKeysController, { prefix: '/v1/license-keys' })
}