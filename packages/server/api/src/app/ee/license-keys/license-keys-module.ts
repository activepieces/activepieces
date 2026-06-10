import { isEmpty, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { exceptionHandler } from '../../helper/exception-handler'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { platformService } from '../../platform/platform.service'
import { licenseKeysController } from './license-keys-controller'
import { licenseKeysService } from './license-keys-service'

export const licenseKeysModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.TRIAL_TRACKER, async () => {
        const platforms = await platformService(app.log).getAll()
        for (const platform of platforms) {
            const platformWithPlan = await platformService(app.log).getOneWithPlan(platform.id)
            if (isNil(platformWithPlan)) {
                continue
            }
            if (isNil(platformWithPlan.plan.licenseKey) || isEmpty(platformWithPlan.plan.licenseKey)) {
                continue
            }
            try {
                const key = await licenseKeysService(app.log).verifyKeyOrReturnNull({
                    platformId: platformWithPlan.id,
                    license: platformWithPlan.plan.licenseKey,
                })
                if (isNil(key)) {
                    await licenseKeysService(app.log).downgradeToFreePlan(platformWithPlan.id)
                    continue
                }
                await licenseKeysService(app.log).applyLimits(platformWithPlan.id, key)
            }
            catch (e) {
                exceptionHandler.handle(e, app.log)
            }
        }
    })
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.TRIAL_TRACKER,
            data: {},
            jobId: SystemJobName.TRIAL_TRACKER,
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
    })
    await app.register(licenseKeysController, { prefix: '/v1/license-keys' })
}