import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const update_user = createAction({
    name: 'update_user',
    auth: simplirouteAuth,
    displayName: 'Update User',
    description: 'Update information of an existing user.',
    props: {
        user_id: Property.Number({ displayName: 'user_id', description: 'User ID to update.', required: true }),
        username: Property.ShortText({ displayName: 'username', description: 'Username (login).', required: true }),
        name: Property.ShortText({ displayName: 'name', description: 'Full name of the user.', required: true }),
        phone: Property.ShortText({ displayName: 'phone', description: 'User phone number.', required: false }),
        email: Property.ShortText({ displayName: 'email', description: 'User email address.', required: false }),
        is_admin: Property.Checkbox({ displayName: 'is_admin', description: 'Whether the user is an administrator.', required: false, defaultValue: false }),
        password: Property.ShortText({ displayName: 'password', description: 'User password.', required: false }),
        is_driver: Property.Checkbox({ displayName: 'is_driver', description: 'Whether the user is a driver.', required: false, defaultValue: false }),
        is_router_jr: Property.Checkbox({ displayName: 'is_router_jr', description: 'Whether the user is a router junior.', required: false, defaultValue: false }),
        is_router: Property.Checkbox({ displayName: 'is_router', description: 'Whether the user is a router.', required: false, defaultValue: false }),
        is_monitor: Property.Checkbox({ displayName: 'is_monitor', description: 'Whether the user is a monitor.', required: false, defaultValue: false }),
        is_coordinator: Property.Checkbox({ displayName: 'is_coordinator', description: 'Whether the user is a coordinator.', required: false, defaultValue: false }),
    },
    async run(context) {
        const { user_id, ...body } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `${API_BASE_URL}/v1/accounts/drivers/${user_id}/`,
            body,
            headers: {
                ...commonHeaders,
                'Authorization': `Token ${context.auth}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});