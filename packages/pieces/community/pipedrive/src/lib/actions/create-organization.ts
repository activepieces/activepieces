import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { isEmpty } from '@activepieces/shared'
import { pipedriveAuth } from '../auth'
import {
    pipedriveApiCall,
    pipedrivePaginatedV1ApiCall,
    pipedriveParseCustomFields,
    pipedriveTransformCustomFields,
} from '../common'
import { organizationCommonProps } from '../common/props'
import { GetField, GetOrganizationResponse } from '../common/types'

export const createOrganizationAction = createAction({
    auth: pipedriveAuth,
    name: 'create-organization',
    displayName: 'Create Organization',
    description: 'Creates a new organization.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        ...organizationCommonProps,
    },
    async run(context) {
        const { name, ownerId, address, visibleTo } = context.propsValue

        const labelIds = (context.propsValue.labelIds as number[]) ?? []
        const customFields = context.propsValue.customfields ?? {}

        const organizationPayload: Record<string, any> = {
            name: name,
            owner_id: ownerId,
            visible_to: visibleTo,
        }

        if (address) {
            if (typeof address === 'string') {
                organizationPayload.address = { value: address }
            }
        }

        if (labelIds.length > 0) {
            organizationPayload.label_ids = labelIds
        }

        const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/organizationFields',
        })

        const orgCustomFields = pipedriveParseCustomFields(customFieldsResponse, customFields)

        if (!isEmpty(orgCustomFields)) {
            organizationPayload.custom_fields = orgCustomFields
        }

        const createdOrganizationResponse = await pipedriveApiCall<GetOrganizationResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/organizations',
            body: organizationPayload,
        })

        const transformedPersonProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            createdOrganizationResponse.data,
        )

        return {
            ...createdOrganizationResponse,
            data: transformedPersonProperties,
        }
    },
})
