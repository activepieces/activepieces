import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { inviteRewardService } from './invite-reward.service'

export const inviteRewardModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.INVITE_REWARD_GRANT, (data) => inviteRewardService(app.log).grantOnJoin(data))
}
