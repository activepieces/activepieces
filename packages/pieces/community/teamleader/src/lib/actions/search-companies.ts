import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchCompanies = createAction({
    name: 'search_companies',
    displayName: 'Search Companies',
    description: 'List or filter companies',
    auth: teamleaderAuth,
    props: {
        term: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search by name, VAT number, emails or telephones',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Filter by email address',
            required: false,
        }),
        vat_number: Property.ShortText({
            displayName: 'VAT Number',
            description: 'Filter by VAT number',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter by company status',
            required: false,
            options: {
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Deactivated', value: 'deactivated' }
                ]
            }
        }),
        tags: Property.ShortText({
            displayName: 'Tags',
            description: 'Filter by tag names (comma-separated)',
            required: false,
        }),
        updated_since: Property.DateTime({
            displayName: 'Updated Since',
            description: 'Only companies updated after this date',
            required: false,
        }),
        sort_field: Property.StaticDropdown({
            displayName: 'Sort Field',
            description: 'Field to sort by',
            required: false,
            options: {
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'Date Added', value: 'added_at' },
                    { label: 'Date Updated', value: 'updated_at' }
                ]
            }
        }),
        sort_order: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'Sort direction',
            required: false,
            options: {
                options: [
                    { label: 'Ascending (A-Z, Oldest First)', value: 'asc' },
                    { label: 'Descending (Z-A, Newest First)', value: 'desc' }
                ]
            }
        }),
        page_size: Property.Number({
            displayName: 'Results Per Page',
            description: 'Number of results per page (default: 20)',
            required: false,
        }),
        page_number: Property.Number({
            displayName: 'Page Number',
            description: 'Page number to retrieve (default: 1)',
            required: false,
        }),
        include_custom_fields: Property.Checkbox({
            displayName: 'Include Custom Fields',
            description: 'Include custom field data in results',
            required: false,
        }),
    },
    async run(context) {
        const requestBody: Record<string, any> = {};

        const filter: Record<string, any> = {};

        if (context.propsValue.term) {
            filter['term'] = context.propsValue.term;
        }

        if (context.propsValue.email) {
            filter['email'] = {
                type: 'primary',
                email: context.propsValue.email
            };
        }

        if (context.propsValue.vat_number) {
            filter['vat_number'] = context.propsValue.vat_number;
        }

        if (context.propsValue.status) {
            filter['status'] = context.propsValue.status;
        }

        if (context.propsValue.tags) {
            const tagList = context.propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tagList.length > 0) {
                filter['tags'] = tagList;
            }
        }

        if (context.propsValue.updated_since) {
            const updatedSince = new Date(context.propsValue.updated_since);
            filter['updated_since'] = updatedSince.toISOString();
        }

        if (Object.keys(filter).length > 0) {
            requestBody['filter'] = filter;
        }

        const page: Record<string, number> = {};

        if (context.propsValue.page_size) {
            page['size'] = context.propsValue.page_size;
        }

        if (context.propsValue.page_number) {
            page['number'] = context.propsValue.page_number;
        }

        if (Object.keys(page).length > 0) {
            requestBody['page'] = page;
        }

        if (context.propsValue.sort_field && context.propsValue.sort_order) {
            requestBody['sort'] = [{
                field: context.propsValue.sort_field,
                order: context.propsValue.sort_order
            }];
        }

        if (context.propsValue.include_custom_fields) {
            requestBody['includes'] = 'custom_fields';
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.list',
            body: requestBody
        });

        return response.body;
    },
});
