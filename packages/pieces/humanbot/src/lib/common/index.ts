import { Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, httpClient, HttpMethod, HttpRequest, Polling } from '@activepieces/pieces-common';

export interface ChatDataItem {
    id: number;
    createdDate: string;
    customerAvatar: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerLocation: string;
    customerDate: string;
    customerTime: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    custom1: string;
    custom2: string;
    custom3: string;
    custom4: string;
    custom5: string;
    campaignTitle: string;
}

export const humanbotCommon = {
    propApiKey: Property.ShortText({
        displayName: 'User API key',
        description: undefined,
        required: true
    }),
    propCampaignEmbedId: Property.ShortText({
        displayName: 'Campaign Embed ID',
        description: undefined,
        required: true,
    }),
    async getConversation(params: { type: string, apiKey: string, campaignEmbedId?: string | undefined }) {
        const API_URL = 'https://app.humanbot.io/api/';
        const queryParams: Record<string, string> = {
            api_key: params.apiKey
        };
        let url = '';
        switch (params.type) {
            case 'chats_email_latest':
                url = `${API_URL}chats_email/latest`;
                break;
            case 'campaign_chats_latest':
                url = `${API_URL}campaign_chats/latest/${params.campaignEmbedId}`;
                break;
            case 'campaign_chats_email_latest':
                url = `${API_URL}campaign_chats_email/latest/${params.campaignEmbedId}`;
                break;
            default:
                url = `${API_URL}chats/latest`;
        }
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url,
            queryParams
        };
        const response = await httpClient.sendRequest<ChatDataItem[]>(request);
        return {
            items: response.body
        };
    }
}

export const polling: Polling<any, { api_key: string, campaign_embed_id?: string, type?: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({propsValue}) => {
        const items = (await humanbotCommon.getConversation({
            type: propsValue.type || '',
            apiKey: propsValue.api_key,
            campaignEmbedId: propsValue?.campaign_embed_id
        })).items;
        console.log(items);
        return items.map((item) => ({
            id: item.id,
            data: item
        }));
    }
}
