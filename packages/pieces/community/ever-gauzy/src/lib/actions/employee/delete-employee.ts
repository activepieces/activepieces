import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const deleteEmployee = createAction({
    auth: gauzyAuth,
    name: 'delete_employee',
    displayName: 'Delete Employee',
    description: 'Delete an employee in Gauzy',
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            required: true,
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const body = {
            userId: context.propsValue.userId,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/api/employees/${context.propsValue.userId}`,
            headers,
            body,
        });

        return response.body;
    },
});
