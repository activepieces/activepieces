import { Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const foreplayCommon = {
    page_id: () => Property.Dropdown({
        displayName: 'Facebook Page',
        description: 'Select the Facebook Page to retrieve ads from.',
        required: true,
        refreshers: ['domain'],
        options: async (context) => {
            if (!context['auth'] || !context['domain']) {
                return {
                    disabled: true, options: [],
                    placeholder: 'Please provide authentication and a domain first.',
                };
            }
            const response = await httpClient.sendRequest<any>({
                method: HttpMethod.GET,
                url: `https://public.api.foreplay.co/api/brand/getBrandsByDomain`,
                queryParams: {
                    domain: context['domain'] as string,
                },
                headers: {
                    // FIX: Get the apiKey from the context object
                    'Authorization': (context['auth'] as { apiKey: string }).apiKey,
                }
            });
            const brands = response.body['data'] || [];
            if (brands.length === 0) {
                return {
                    disabled: true, options: [],
                    placeholder: 'No brands found for this domain.',
                };
            }
            return {
                disabled: false,
                options: brands.map((brand: any) => ({
                    label: `${brand.name} (${brand.ad_library_id})`,
                    value: brand.ad_library_id,
                })),
            };
        }
    }),
    board_id: () => Property.Dropdown({
        displayName: 'Board',
        description: 'Select the board.',
        required: true,
        refreshers: [],
        options: async (context) => {
            if (!context['auth']) {
                return {
                    disabled: true, options: [],
                    placeholder: 'Please authenticate first.',
                };
            }
            const response = await httpClient.sendRequest<any>({
                method: HttpMethod.GET,
                url: `https://public.api.foreplay.co/api/boards`,
                headers: {
                    // FIX: Get the apiKey from the context object
                    'Authorization': (context['auth'] as { apiKey: string }).apiKey,
                }
            });
            const boards = response.body['data'] || [];
            return {
                disabled: false,
                options: boards.map((board: { id: string, name: string }) => ({
                    label: board.name,
                    value: board.id,
                })),
            };
        }
    }),
    spyderBrand_id: () => Property.Dropdown({
        displayName: 'Spyder Brand',
        description: 'Select the Spyder brand to monitor for new ads.',
        required: true,
        refreshers: [],
        options: async (context) => {
            if (!context['auth']) {
                return {
                    disabled: true, options: [],
                    placeholder: 'Please authenticate first.',
                };
            }
            const response = await httpClient.sendRequest<any>({
                method: HttpMethod.GET,
                url: `https://public.api.foreplay.co/api/spyder/brands`,
                headers: {
                    // FIX: Get the apiKey from the context object
                    'Authorization': (context['auth'] as { apiKey: string }).apiKey,
                }
            });
            const brands = response.body['data'] || [];
            return {
                disabled: false,
                options: brands.map((brand: { id: string, name: string }) => ({
                    label: brand.name,
                    value: brand.id,
                })),
            };
        }
    }),
};