import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCampaign = createAction({
    name: 'create_campaign',
    displayName: 'Create Campaign',
    description: 'Create a new campaign with campaign name, subject, topic, sender details, and mailing list',
    props: {
        campaignName: {
            type: 'string',
            displayName: 'Campaign Name',
            required: true,
        },
        subject: {
            type: 'string',
            displayName: 'Subject',
            required: true,
        },
        fromName: {
            type: 'string',
            displayName: 'Sender Name',
            required: true,
        },
        fromEmail: {
            type: 'string',
            displayName: 'Sender Email',
            required: true,
        },
        listKey: {
            type: 'string',
            displayName: 'Mailing List Key',
            required: true,
        },
        content: {
            type: 'string',
            displayName: 'Email Content',
            required: true,
        },
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.POST,
            path: '/createcampaign',
            body: {
                campaignName: context.propsValue.campaignName,
                subject: context.propsValue.subject,
                fromName: context.propsValue.fromName,
                fromEmail: context.propsValue.fromEmail,
                listKey: context.propsValue.listKey,
                content: context.propsValue.content,
                contentType: 'html',
            },
        });

        return response;
    },
});
