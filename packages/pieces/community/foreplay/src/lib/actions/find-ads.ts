import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';

export const findAds = createAction({
    auth: foreplayAuth,
    name: 'find_ads',
    displayName: 'Find Ads',
    description: 'Find ads by domain, with optional filters for dates, platforms, and more.',
    props: {
        domain: Property.ShortText({
            displayName: 'Domain',
            description: "Finds all brands for this domain, then searches for their ads.",
            required: true,
        }),
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
                    { label: 'Video', value: 'video' }, { label: 'Carousel', value: 'carousel' },
                    { label: 'Image', value: 'image' }, { label: 'DCO', value: 'dco' },
                    { label: 'DPA', value: 'dpa' },
                ]
            }
        }),
        publisher_platform: Property.StaticMultiSelectDropdown({
            displayName: 'Publisher Platform',
            required: false,
            options: {
                options: [
                    { label: 'Facebook', value: 'facebook' }, { label: 'Instagram', value: 'instagram' },
                    { label: 'Audience Network', value: 'audience_network' }, { label: 'Messenger', value: 'messenger' },
                ]
            }
        }),
        start_date: Property.DateTime({
            displayName: 'Start Date',
            required: false,
        }),
        end_date: Property.DateTime({
            displayName: 'End Date',
            required: false,
        }),
        order: Property.StaticDropdown({
            displayName: 'Order By',
            required: false,
            defaultValue: 'newest',
            options: {
                options: [
                    { label: 'Newest', value: 'newest' }, { label: 'Oldest', value: 'oldest' },
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

        const brandsResponse = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `https://public.api.foreplay.co/api/brand/getBrandsByDomain`,
            queryParams: { domain: props['domain'] as string },
            headers: { 'Authorization': apiKey }
        });

        const brands = brandsResponse.body['data'] || [];
        if (brands.length === 0) {
            return [];
        }
        const brand_ids = brands.map((brand: { id: string }) => brand.id);

        const queryParams: Record<string, any> = { brand_ids };

        if (props['live'] !== undefined) queryParams['live'] = String(props['live']);
        
        // FIX: Check if the array has a length greater than 0
        if (props['display_format'] && (props['display_format'] as string[]).length > 0) {
            queryParams['display_format'] = props['display_format'];
        }
        // FIX: Apply the same check to the other multi-select dropdown
        if (props['publisher_platform'] && (props['publisher_platform'] as string[]).length > 0) {
            queryParams['publisher_platform'] = props['publisher_platform'];
        }

        if (props['start_date']) queryParams['start_date'] = props['start_date'];
        if (props['end_date']) queryParams['end_date'] = props['end_date'];
        if (props['order']) queryParams['order'] = props['order'];
        if (props['limit']) queryParams['limit'] = String(props['limit']);

        const adsResponse = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `https://public.api.foreplay.co/api/brand/getAdsByBrandId`,
            queryParams: queryParams,
            headers: {
                'Authorization': apiKey
            }
        });

        return adsResponse.body['data'];
    },
});