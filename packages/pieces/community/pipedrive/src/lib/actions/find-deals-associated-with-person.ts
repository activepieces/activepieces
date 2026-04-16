import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import { pipedriveAuth } from '../auth'
import { pipedrivePaginatedV1ApiCall, pipedrivePaginatedV2ApiCall, pipedriveTransformCustomFields } from '../common'
import { DEAL_OPTIONAL_FIELDS } from '../common/constants'
import { personIdProp } from '../common/props'
import { GetField } from '../common/types'

export const findDealsAssociatedWithPersonAction = createAction({
    auth: pipedriveAuth,
    name: 'find-deals-associated-with-person',
    displayName: 'Find Deals Associated With Person',
    description: 'Finds multiple deals related to a specific person.',
    props: {
        personId: personIdProp(true),
    },
    async run(context) {
        const { personId } = context.propsValue

        const deals = await pipedrivePaginatedV2ApiCall<Record<string, any>>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/deals`,
            query: {
                person_id: personId,
                sort_by: 'update_time',
                sort_direction: 'desc',
                include_fields: DEAL_OPTIONAL_FIELDS.join(','),
            },
        })

        if (isNil(deals) || deals.length === 0) {
            return {
                found: false,
                data: [],
            }
        }

        const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/dealFields',
        })

        const result = []
        for (const deal of deals) {
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal)
            result.push(updatedDealProperties)
        }

        return {
            found: true,
            data: result,
        }
    },
})
