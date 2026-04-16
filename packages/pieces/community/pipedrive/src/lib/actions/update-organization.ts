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
import { organizationCommonProps, organizationIdProp } from '../common/props'
import { GetField, GetOrganizationResponse } from '../common/types'

export const updateOrganizationAction = createAction({
    auth: pipedriveAuth,
    name: 'update-organization',
    displayName: 'Update Organization',
    description: 'Updates an existing organization.',
    props: {
        organizationId: organizationIdProp(true),
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        ...organizationCommonProps,
    },
    async run(context) {
        const { name, ownerId, address, visibleTo, organizationId } = context.propsValue

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

        const updatedOrganizationResponse = await pipedriveApiCall<GetOrganizationResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH,
            resourceUri: `/v2/organizations/${organizationId}`,
            body: organizationPayload,
        })

        const transformedOrganizationProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            updatedOrganizationResponse.data,
        )

        return {
            ...updatedOrganizationResponse,
            data: transformedOrganizationProperties,
        }
    },
})
