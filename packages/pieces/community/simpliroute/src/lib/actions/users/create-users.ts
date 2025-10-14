import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_users = createAction({
    name: 'create_users',
    auth: simplirouteAuth,
    displayName: 'Create User',
    description: 'Create new user/driver in the account.',
    props: {
        username: Property.ShortText({ displayName: 'username', description: 'Nombre de usuario (login).', required: true }),
        name: Property.ShortText({ displayName: 'name', description: 'Nombre completo del usuario.', required: false }),
        phone: Property.ShortText({ displayName: 'phone', description: 'Número de teléfono.', required: false }),
        email: Property.ShortText({ displayName: 'email', description: 'Correo electrónico.', required: false }),
        is_admin: Property.Checkbox({ displayName: 'is_admin', description: 'Whether the user is an administrator.', required: false, defaultValue: false }),
        password: Property.ShortText({ displayName: 'password', description: 'User password.', required: true }),
        is_driver: Property.Checkbox({ displayName: 'is_driver', description: 'Whether the user is a driver.', required: true, defaultValue: false }),
        is_router_jr: Property.Checkbox({ displayName: 'is_router_jr', description: 'Whether the user is a router junior.', required: false, defaultValue: false }),
        is_router: Property.Checkbox({ displayName: 'is_router', description: 'Whether the user is a router.', required: false, defaultValue: false }),
        is_monitor: Property.Checkbox({ displayName: 'is_monitor', description: 'Whether the user is a monitor.', required: false, defaultValue: false }),
        is_coordinator: Property.Checkbox({ displayName: 'is_coordinator', description: 'Whether the user is a coordinator.', required: false, defaultValue: false }),                
    },
    async run(context) {
        const body = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/accounts/drivers/`,
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