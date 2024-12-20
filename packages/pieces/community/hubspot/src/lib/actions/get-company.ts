import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { additionalPropertyNamesDropdown, getDefaultProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getCompanyAction = createAction({
    auth: hubspotAuth,
    name: 'get-company',
    displayName: 'Get Company',
    description: 'Gets a company.',
    props: {
        companyId : Property.ShortText({
            displayName: 'Company ID',
            description: 'The ID of the company to get.',
            required: true,
        }),
        additionalProperties:additionalPropertyNamesDropdown(OBJECT_TYPE.COMPANY)

    },
    async run(context) {
        const companyId = context.propsValue.companyId;
        const additionalProperties = context.propsValue.additionalProperties ?? [];

        const defaultProperties = getDefaultProperties(OBJECT_TYPE.COMPANY)

        const companyResponse = await hubspotApiCall({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            resourceUri:`/crm/v3/objects/companies/${companyId}`,
            query:{
                properties: [...defaultProperties, ...additionalProperties].join(',')
            }
        })

        return companyResponse;
    },
});
