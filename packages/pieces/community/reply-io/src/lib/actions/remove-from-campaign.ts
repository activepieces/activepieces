import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'

import { replyIoAuth } from '../auth'
import { replyIoRequest } from '../common/client'
import { campaignIdProp } from '../common/props'

export const removeFromCampaignAction = createAction({
    name: 'remove_from_campaign',
    displayName: 'Remove Contact from Campaign',
    description:
        "Stop a contact from receiving further emails in a specific campaign. The contact's record is kept in Reply.io.",
    auth: replyIoAuth,
    props: {
        campaignId: campaignIdProp,
        email: Property.ShortText({
            displayName: 'Contact Email Address',
            description: 'Email address of the contact to remove from the campaign.',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const response = await replyIoRequest({
            apiKey: auth.secret_text,
            method: HttpMethod.POST,
            path: '/v1/actions/removepersonfromcampaignbyid',
            body: {
                campaignId: Number(propsValue.campaignId),
                email: propsValue.email,
            },
        })

        return response.body
    },
})
