import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const getEmployee = createAction({
    auth: gauzyAuth,
    name: 'get_employee',
    displayName: 'Get Employee',
    description: 'Retrieve details of a specific employee by ID',
    props: {
        id: Property.ShortText({
            displayName: 'Employee ID',
            required: true,
            description: 'The ID of the employee to retrieve',
        }),
        select: Property.LongText({
            displayName: 'Select Fields',
            required: false,
            description: 'Comma-separated list of fields to select (e.g., "id,firstName,lastName")',
        }),
        relations: Property.LongText({
            displayName: 'Relations',
            required: false,
            description: 'Comma-separated list of relations to include (e.g., "user,organization,tags")',
        }),
        order: Property.LongText({
            displayName: 'Order',
            required: false,
            description: 'Sorting order (e.g., "firstName ASC,lastName DESC")',
        }),
        where: Property.LongText({
            displayName: 'Where Conditions',
            required: false,
            description: 'JSON string with conditions (e.g., {"firstName":"John","isActive":true})',
        }),
        withDeleted: Property.Checkbox({
            displayName: 'Include Deleted',
            required: false,
            description: 'Whether to include soft-deleted employees',
            defaultValue: false,
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (context.propsValue.select) {
            queryParams.append('select', context.propsValue.select);
        }
        
        if (context.propsValue.relations) {
            queryParams.append('relations', context.propsValue.relations);
        }
        
        if (context.propsValue.order) {
            queryParams.append('order', context.propsValue.order);
        }
        
        if (context.propsValue.where) {
            queryParams.append('where', context.propsValue.where);
        }
        
        if (context.propsValue.withDeleted) {
            queryParams.append('withDeleted', 'true');
        }

        // Build the URL with the employee ID and query parameters
        const url = `${baseUrl}/api/employee/${context.propsValue.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers,
        });

        return response.body;
    },
});
