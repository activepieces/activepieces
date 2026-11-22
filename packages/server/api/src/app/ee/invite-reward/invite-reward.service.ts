import { isNil, tryCatch } from '@activepieces/core-utils'
import { TelemetryEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { telemetry } from '../../helper/telemetry.utils'
import { billingProvider } from '../../platform/billing-provider'
import { InvitedUserJoinedParams } from '../../user-invitations/user-invitation-hooks'
import { autumnConsole } from '../platform/platform-plan/billing-providers/autumn-utils'

export const inviteRewardService = (log: FastifyBaseLogger) => ({
    async grantOnJoin({ platformId, invitationId, inviteeEmail }: InvitedUserJoinedParams): Promise<void> {
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            log.info({ platform: { id: platformId }, invitationId }, '[inviteReward#grantOnJoin] no billing account, no reward')
            return
        }
        const logContext = { platform: { id: platformId }, autumnCustomerId: creds.autumnCustomerId, invitationId }
        const { data: result, error } = await tryCatch(() => autumnConsole.grantInviteReward({ autumnCustomerId: creds.autumnCustomerId, inviteeEmail }))
        if (!isNil(error) || isNil(result)) {
            log.error({ ...logContext, error }, '[inviteReward#grantOnJoin] the console call failed, retry it by hand with this customer id')
            return
        }
        log.info({ ...logContext, result }, '[inviteReward#grantOnJoin] console answered')
        if (!result.granted) {
            return
        }
        const { error: refreshError } = await tryCatch(() => billingProvider.get(log).refreshEntitlements(platformId))
        if (!isNil(refreshError)) {
            log.warn({ ...logContext, error: refreshError }, '[inviteReward] balance refresh failed after a grant')
        }
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.INVITE_REWARD_GRANTED,
                payload: { platformId, credits: result.credits },
            },
        })
    },
})
