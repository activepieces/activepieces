import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { lobstermailAuth } from '../..'
import { lobstermailCommon } from '../common'

export const getAccount = createAction({
    auth: lobstermailAuth,
    name: 'get_account',
    displayName: 'Get Account',
    description: 'Get account details including subscription tier, usage, and sending limits.',
    props: {},
    async run(context) {
        const response = await httpClient.sendRequest<{
            tier: number
            tierName: string
            verified: boolean
            usage?: { emailsThisMonth?: number; sendsToday?: number }
            limits?: { maxInboxes?: number; sendsPerDay?: number; emailsPerMonth?: number }
        }>({
            method: HttpMethod.GET,
            url: `${lobstermailCommon.baseUrl}/v1/account`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.secret_text,
            },
        })

        const account = response.body
        return {
            tier: account.tier,
            tier_name: account.tierName ?? null,
            verified: account.verified,
            usage_emails_this_month: account.usage?.emailsThisMonth ?? null,
            usage_sends_today: account.usage?.sendsToday ?? null,
            limit_max_inboxes: account.limits?.maxInboxes ?? null,
            limit_sends_per_day: account.limits?.sendsPerDay ?? null,
            limit_emails_per_month: account.limits?.emailsPerMonth ?? null,
        }
    },
})
