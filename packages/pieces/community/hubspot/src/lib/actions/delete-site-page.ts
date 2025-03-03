import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const deleteSitePageAction = createAction({
    auth: hubspotAuth,
    name: 'delete-site-page',
    displayName: 'Delete Site Page',
    description: 'Deletes an existing site page.',
    props: {
        pageId: Property.ShortText({
            displayName: 'Page ID',
            description: 'The ID of the site page to delete.',
            required: true,
        }),
    },
    async run(context) {
        const { pageId } = context.propsValue;
        const client = new Client({ accessToken: context.auth.access_token });

        const response = await client.cms.pages.sitePagesApi.archive(pageId);

        return response;
    },
});
