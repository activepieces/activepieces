import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, LanguagesEnum } from '../../common';

export const updateEmployee = createAction({
    auth: gauzyAuth,
    name: 'update_employee',
    displayName: 'Update Employee',
    description: 'Update an employee in Gauzy',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: true,
        }),
        roleId: Property.ShortText({
            displayName: 'Role ID',
            required: false,
        }),
        role: Property.ShortText({
            displayName: 'Role',
            required: false,
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            required: true,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            required: true,
        }),
        imageUrl: Property.ShortText({
            displayName: 'Image URL',
            required: false,
        }),
        preferredLanguage: Property.ShortText({
            displayName: 'Preferred Language',
            required: false,
        }),
        userId: Property.ShortText({
            displayName: 'User ID',
            required: true,
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const body = {
            user: {
                email: context.propsValue.email,
                roleId: context.propsValue.roleId,
                role: context.propsValue.role,
                firstName: context.propsValue.firstName,
                lastName: context.propsValue.lastName,
                imageUrl: context.propsValue.imageUrl,
                preferredLanguage: context.propsValue.preferredLanguage || LanguagesEnum.ENGLISH,
            },
            userId: context.propsValue.userId,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `${baseUrl}/api/employee/${context.propsValue.userId}`,
            headers,
            body,
        });

        return response.body;
    },
})
