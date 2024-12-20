import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { additionalPropertyNamesDropdown, getDefaultProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getDealAction = createAction({
    auth: hubspotAuth,
    name: 'get-deal',
    displayName: 'Get Deal',
    description: 'Gets a deal.',
    props: {
        dealId : Property.ShortText({
            displayName: 'Deal ID',
            description: 'The ID of the deal to get.',
            required: true,
        }),
        additionalProperties:additionalPropertyNamesDropdown(OBJECT_TYPE.DEAL)

    },
    async run(context) {
        const dealId = context.propsValue.dealId;
        const additionalProperties = context.propsValue.additionalProperties ?? [];

        const defaultProperties = getDefaultProperties(OBJECT_TYPE.DEAL)

        // https://developers.hubspot.com/docs/reference/api/crm/objects/deals#get-%2Fcrm%2Fv3%2Fobjects%2Fdeals%2F%7Bdealid%7D
        const dealResponse = await hubspotApiCall({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            resourceUri:`/crm/v3/objects/deals/${dealId}`,
            query:{
                properties: [...defaultProperties, ...additionalProperties].join(',')
            }
        })

        return dealResponse;
    },
});
