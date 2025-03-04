import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const getSitePageAction = createAction({
    auth: hubspotAuth,
    name: 'get-site-page',
    displayName: 'Get Site Page',
    description: 'Gets site page deatils.',
    props: {
        pageId: Property.ShortText({
            displayName: 'Page ID',
            description: 'The ID of the site page to get.',
            required: true,
        }),
    },
    async run(context) {
        const { pageId } = context.propsValue;
        const client = new Client({ accessToken: context.auth.access_token });

        const response = await client.cms.pages.sitePagesApi.getById(pageId);

        return response;
    },
});
