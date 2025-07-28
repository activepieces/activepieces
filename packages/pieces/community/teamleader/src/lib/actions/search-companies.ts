import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchCompanies = createAction({
    name: 'search_companies',
    displayName: 'Search Companies',
    description: 'List or filter companies in Teamleader',
    auth: teamleaderAuth,
    props: {
        filter_by: Property.StaticDropdown({
            displayName: 'Filter By',
            description: 'Choose how to filter companies',
            required: false,
            options: {
                options: [
                    { label: 'No Filter (List All)', value: 'none' },
                    { label: 'Name', value: 'name' },
                    { label: 'City', value: 'city' },
                    { label: 'Country', value: 'country' },
                    { label: 'Email', value: 'email' },
                    { label: 'Tag', value: 'tag' }
                ]
            },
            defaultValue: 'none'
        }),
        filter_value: Property.ShortText({
            displayName: 'Filter Value',
            description: 'Value to filter by (required if filter is selected)',
            required: false,
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Choose field to sort results by',
            required: false,
            options: {
                options: [
                    { label: 'Name (A-Z)', value: 'name' },
                    { label: 'Name (Z-A)', value: '-name' },
                    { label: 'Added (Newest First)', value: '-added_at' },
                    { label: 'Added (Oldest First)', value: 'added_at' },
                    { label: 'Updated (Most Recent First)', value: '-updated_at' },
                    { label: 'Updated (Oldest First)', value: 'updated_at' }
                ]
            }
        }),
        page_size: Property.Number({
            displayName: 'Results Per Page',
            description: 'Number of results to return per page (max 100)',
            required: false,
            defaultValue: 20
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Page number to return',
            required: false,
            defaultValue: 1
        }),
        include_details: Property.Checkbox({
            displayName: 'Include Detailed Information',
            description: 'Fetch detailed information for each company',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const { filter_by, filter_value, sort_by, page_size, page, include_details } = context.propsValue;
        
        // Prepare query parameters
        const queryParams: Record<string, string> = {};
        
        // Add pagination parameters
        if (page) {
            queryParams['page[number]'] = page.toString();
        }
        
        if (page_size) {
            const size = Math.min(page_size, 100); // Cap at 100 which is typically API max
            queryParams['page[size]'] = size.toString();
        }
        
        // Add sorting parameter
        if (sort_by) {
            queryParams['sort'] = sort_by;
        }
        
        // Add filter parameters
        if (filter_by && filter_by !== 'none' && filter_value) {
            if (filter_by === 'name') {
                queryParams['filter[name]'] = filter_value;
            } else if (filter_by === 'city') {
                queryParams['filter[city]'] = filter_value;
            } else if (filter_by === 'country') {
                queryParams['filter[country]'] = filter_value;
            } else if (filter_by === 'email') {
                queryParams['filter[email]'] = filter_value;
            } else if (filter_by === 'tag') {
                queryParams['filter[tags]'] = filter_value;
            }
        }

        // Fetch companies list
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/companies.list',
            queryParams
        });

        // If we don't need detailed information, return the list as is
        if (!include_details) {
            return response.body;
        }

        // If detailed info is requested, fetch full details for each company
        const companies = response.body.data;
        const detailedCompanies = [];

        for (const company of companies) {
            const detailedInfo = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/companies.info',
                queryParams: {
                    id: company.id
                }
            });
            
            detailedCompanies.push(detailedInfo.body.data);
        }

        // Return results with pagination info
        return {
            ...response.body,
            data: detailedCompanies
        };
    },
});
