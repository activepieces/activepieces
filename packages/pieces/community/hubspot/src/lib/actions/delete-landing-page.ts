import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const deleteLandingPageAction = createAction({
    auth: hubspotAuth,
    name: 'delete-landing-page',
    displayName: 'Delete Landing Page',
    description: 'Deletes an existing landing page.',
    props: {
        pageId: Property.ShortText({
            displayName: 'Page ID',
            description: 'The ID of the landing page to delete.',
            required: true,
        }),
    },
    async run(context) {
        const { pageId } = context.propsValue;
        const client = new Client({ accessToken: context.auth.access_token });

        const response = await client.cms.pages.landingPagesApi.archive(pageId);

        return response;
    },
});
