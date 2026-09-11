import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';
import { hkVoiceProps } from '../common/props';

export const listCampaignsAction = createAction({
    auth: hkVoiceAuth,
    name: 'list_campaigns',
    classification: 'READ',
    displayName: 'List Campaigns',
    description: 'Lists Voice campaigns for the organization.',
    audience: 'both',
    aiMetadata: {
        description: 'Lists Voice campaigns available to the API key.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.campaigns,
            query: { limit: 200, offset: 0 },
        });
        return {
            campaigns: hkVoiceApi.extractList({
                body,
                collectionKeys: ['results', 'campaigns'],
            }),
        };
    },
});

export const startCampaignAction = createAction({
    auth: hkVoiceAuth,
    name: 'start_campaign',
    classification: 'WRITE',
    displayName: 'Start Campaign',
    description: 'Starts dialing for an existing Voice campaign (POST /campaigns/{id}/start/).',
    audience: 'both',
    aiMetadata: {
        description:
            'Starts an existing Heykoala Voice outbound campaign. Create the campaign in Voice first, then start it from Zwigly.',
        idempotent: false,
    },
    props: {
        campaign_id: hkVoiceProps.campaignId,
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.POST,
            path: hkVoiceApi.paths.campaignStart(context.propsValue.campaign_id),
        });
        return hkVoiceApi.flattenBody(body);
    },
});
