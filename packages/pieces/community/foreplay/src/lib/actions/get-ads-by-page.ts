import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';
import { foreplayCommon } from '../common/props';

export const getAdsByPage = createAction({
    auth: foreplayAuth,
    name: 'get_ads_by_page',
    displayName: 'Get Ads by Page',
    description: 'Retrieve all ads belonging to a given Facebook Page ID.',
    props: {
        domain: Property.ShortText({
            displayName: 'Domain',
            description: 'Enter a domain name to find associated Facebook Pages.',
            required: true,
        }),
        page_id: foreplayCommon.page_id(foreplayAuth),
        live: Property.StaticDropdown({
            displayName: 'Live Status',
            required: false,
            options: {
                options: [
                    { label: 'Live Ads', value: true },
                    { label: 'Inactive Ads', value: false },
                ]
            }
        }),
        display_format: Property.StaticMultiSelectDropdown({
            displayName: 'Display Format',
            required: false,
            options: {
                options: [
                    { label: 'Video', value: 'video' },
                    { label: 'Carousel', value: 'carousel' },
                    { label: 'Image', value: 'image' },
                    { label: 'DCO', value: 'dco' },
                    { label: 'DPA', value: 'dpa' },
                ]
            }
        }),
        publisher_platform: Property.StaticMultiSelectDropdown({
            displayName: 'Publisher Platform',
            required: false,
            options: {
                options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Audience Network', value: 'audience_network' },
                    { label: 'Messenger', value: 'messenger' },
                ]
            }
        }),
        order: Property.StaticDropdown({
            displayName: 'Order By',
            required: false,
            defaultValue: 'newest',
            options: {
                options: [
                    { label: 'Newest', value: 'newest' },
                    { label: 'Oldest', value: 'oldest' },
                    { label: 'Longest Running', value: 'longest_running' },
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of ads to return (default 10, max 250).',
            required: false,
        }),
    },
    async run(context) {
        const { apiKey } = context.auth;
        const props = context.propsValue;
        const queryParams: Record<string, string | string[]> = {};
        
        queryParams['page_id'] = props['page_id'] as string;

        if (props['live'] !== undefined) {
            queryParams['live'] = String(props['live']);
        }
        if (props['display_format']) {

            queryParams['display_format'] = props['display_format'] as string[];
        }
        if (props['publisher_platform']) {
            queryParams['publisher_platform'] = props['publisher_platform'] as string[];
        }
        if (props['order']) {
            queryParams['order'] = props['order'] as string;
        }
        if (props['limit']) {
            queryParams['limit'] = String(props['limit']);
        }

        const response = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `https://public.api.foreplay.co/api/brand/getAdsByPageId`,
            queryParams: queryParams as any,
            headers: {
                'Authorization': apiKey
            }
        });

        return response.body['data'];
    },
});