import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const listEmployees = createAction({
    auth: gauzyAuth,
    name: 'list_employees',
    displayName: 'List Employees',
    description: 'Retrieve a list of employees in the same tenant',
    props: {
        select: Property.Object({
            displayName: 'Select Fields',
            required: false,
            description: 'Specify which fields to return (e.g., {"id": true, "firstName": true})',
        }),
        relations: Property.Object({
            displayName: 'Relations',
            required: false,
            description: 'Specify related entities to include (e.g., {"user": true, "organization": true})',
        }),
        order: Property.Object({
            displayName: 'Order',
            required: false,
            description: 'Specify sorting order (e.g., {"firstName": "ASC", "lastName": "DESC"})',
        }),
        where: Property.Object({
            displayName: 'Where Conditions',
            required: true,
            description: 'Filter conditions (e.g., {"isActive": true})',
        }),
        withDeleted: Property.Checkbox({
            displayName: 'Include Deleted',
            required: false,
            description: 'Whether to include soft-deleted employees',
            defaultValue: false,
        }),
        take: Property.Number({
            displayName: 'Take',
            required: false,
            description: 'Number of records to take (limit)',
        }),
        skip: Property.Number({
            displayName: 'Skip',
            required: false,
            description: 'Number of records to skip (offset)',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Handle select fields
        if (context.propsValue.select) {
            queryParams.append('select', JSON.stringify(context.propsValue.select));
        }
        
        // Handle relations
        if (context.propsValue.relations) {
            queryParams.append('relations', JSON.stringify(context.propsValue.relations));
        }
        
        // Handle order
        if (context.propsValue.order) {
            queryParams.append('order', JSON.stringify(context.propsValue.order));
        }
        
        // Handle where conditions
        if (context.propsValue.where) {
            queryParams.append('where', JSON.stringify(context.propsValue.where));
        }
        
        // Handle withDeleted flag
        if (context.propsValue.withDeleted) {
            queryParams.append('withDeleted', context.propsValue.withDeleted.toString());
        }
        
        // Handle pagination
        if (context.propsValue.take !== undefined) {
            queryParams.append('take', context.propsValue.take.toString());
        }
        
        if (context.propsValue.skip !== undefined) {
            queryParams.append('skip', context.propsValue.skip.toString());
        }

        // Build the URL with query parameters
        const url = `${baseUrl}/api/employee${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers,
        });

        return response.body;
    },
});
