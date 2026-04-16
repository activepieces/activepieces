import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { zooAuth } from '../../auth'

export const updateOrgSubscriptionAction = createAction({
    name: 'update_org_subscription',
    displayName: 'Update Organization Subscription',
    description: 'Update the subscription for your organization',
    auth: zooAuth,
    // category: 'Payments',
    props: {
        planId: Property.ShortText({
            displayName: 'Plan ID',
            required: true,
            description: 'ID of the subscription plan',
        }),
    },
    async run({ auth, propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: 'https://api.zoo.dev/org/payment/subscriptions',
            headers: {
                Authorization: `Bearer ${auth.secret_text}`,
            },
            body: {
                plan_id: propsValue.planId,
            },
        })
        return response.body
    },
})
