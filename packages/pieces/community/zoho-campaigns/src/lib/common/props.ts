import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';


interface MailingList {
    list_key: string;
    list_name: string;
}

interface Topic {
    topic_id: string;
    topic_name: string;
}


interface Campaign {
    campaign_key: string;
    campaign_name: string;
}
interface GetCampaignsResponse {
    campaign_details: Campaign[];
}


interface GetListsResponse {
    list_of_details: MailingList[];
}

interface GetTopicsResponse {
    topics: Topic[];
}

interface Tag {
    tag_name: string;
}
interface GetTagsResponse {
    tags: Tag[];
}


export const zohoCampaignsCampaignDropdown = Property.Dropdown({
    displayName: 'Campaign',
    description: 'Select a campaign.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetCampaignsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/getcampaigns`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
                sort_order: 'desc', 
            },
        });

        const campaigns = response.body.campaign_details || [];
        return {
            disabled: false,
            options: campaigns.map((campaign) => ({
                label: campaign.campaign_name,
                value: campaign.campaign_key,
            })),
        };
    },
});

export const zohoCampaignsSingleMailingListDropdown = Property.Dropdown({
    displayName: 'Mailing List',
    description: 'The mailing list to add the contact to.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetListsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/getmailinglists`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const lists = response.body.list_of_details || [];
        return {
            disabled: false,
            options: lists.map((list) => ({
                label: list.list_name,
                value: list.list_key,
            })),
        };
    },
});


export const zohoCampaignsMailingListDropdown = Property.MultiSelectDropdown({
    displayName: 'Mailing List',
    description: 'Select the mailing list(s) for the campaign.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetListsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/getmailinglists`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const lists = response.body.list_of_details || [];
        return {
            disabled: false,
            options: lists.map((list) => ({
                label: list.list_name,
                value: list.list_key,
            })),
        };
    },
});

export const zohoCampaignsTopicDropdown = Property.Dropdown({
    displayName: 'Topic',
    description: 'Select a topic for the campaign. This is mandatory if Topic Management is enabled in your account.',
    required: false, 
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetTopicsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/gettopics`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const topics = response.body.topics || [];
        return {
            disabled: false,
            options: topics.map((topic) => ({
                label: topic.topic_name,
                value: topic.topic_id,
            })),
        };
    },
});

export const zohoCampaignsSingleTagDropdown = Property.Dropdown({
    displayName: 'Tag',
    description: 'Select the tag to remove from the contact.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetTagsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/tags/get`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const tags = response.body.tags || [];
        return {
            disabled: false,
            options: tags.map((tag) => ({
                label: tag.tag_name,
                value: tag.tag_name,
            })),
        };
    },
});


export const zohoCampaignsTagsDropdown = Property.MultiSelectDropdown({
    displayName: 'Tags',
    description: 'Select the tag(s) to apply to the contact.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetTagsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/tags/get`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const tags = response.body.tags || [];
        return {
            disabled: false,
            options: tags.map((tag) => ({
                label: tag.tag_name,
                value: tag.tag_name,
            })),
        };
    },
});

export const zohoCampaignsOptionalMailingListDropdown = Property.Dropdown({
    displayName: 'Mailing List (Optional)',
    description: 'Optionally, select a mailing list to search within.',
    required: false, 
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Zoho Campaigns account first.',
            };
        }

        const authValue = auth as OAuth2PropertyValue;
        const response = await httpClient.sendRequest<GetListsResponse>({
            method: HttpMethod.GET,
            url: `https://campaigns.zoho.com/api/v1.1/getmailinglists`,
            headers: {
                Authorization: `Zoho-oauthtoken ${authValue.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
            },
        });

        const lists = response.body.list_of_details || [];
        return {
            disabled: false,
            options: lists.map((list) => ({
                label: list.list_name,
                value: list.list_key,
            })),
        };
    },
});