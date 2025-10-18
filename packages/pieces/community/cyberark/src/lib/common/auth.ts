import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const cyberarkAuth = PieceAuth.CustomAuth({
    required: true,
    description: 'CyberArk PAM authentication credentials',
    props: {
        baseUrl: Property.ShortText({
            displayName: 'Base URL',
            description: 'Your CyberArk PVWA base URL (e.g., https://pvwa.company.com)',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'CyberArk username',
            required: true,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'CyberArk password',
            required: true,
        }),
        authType: Property.StaticDropdown({
            displayName: 'Authentication Type',
            description: 'Authentication method',
            required: true,
            defaultValue: 'CyberArk',
            options: {
                disabled: false,
                options: [
                    { label: 'CyberArk', value: 'CyberArk' },
                    { label: 'LDAP', value: 'LDAP' },
                    { label: 'RADIUS', value: 'RADIUS' },
                ],
            },
        }),
    },
});

export type CyberArkAuth = {
    baseUrl: string;
    username: string;
    password: string;
    authType: string;
};
