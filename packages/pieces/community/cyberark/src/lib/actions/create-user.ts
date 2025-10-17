import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getFieldsForUserType = (userType: string): DynamicPropsValue => {
    const commonFields = {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'User email address',
            required: false,
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'User first name',
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'User last name',
            required: false,
        }),
        changePasswordOnNextLogon: Property.Checkbox({
            displayName: 'Change Password On Next Logon',
            description: 'Require password change on next logon',
            required: false,
            defaultValue: true,
        }),
        disabled: Property.Checkbox({
            displayName: 'Disabled',
            description: 'Create user in disabled state',
            required: false,
            defaultValue: false,
        }),
    };

    if (userType === 'EPVUser') {
        return {
            ...commonFields,
            initialPassword: Property.ShortText({
                displayName: 'Initial Password',
                description: 'Initial password for the user',
                required: false,
            }),
            expiryDate: Property.ShortText({
                displayName: 'Expiry Date',
                description: 'User expiry date (Unix timestamp in seconds)',
                required: false,
            }),
            userTypeName: Property.ShortText({
                displayName: 'User Type Name',
                description: 'User type name',
                required: false,
            }),
            location: Property.ShortText({
                displayName: 'Location',
                description: 'User location',
                required: false,
            }),
        };
    }

    return commonFields;
};

export const createUser = createAction({
    auth: cyberarkAuth,
    name: 'create_user',
    displayName: 'Create User',
    description: 'Creates a new user in CyberArk',
    props: {
        username: Property.ShortText({
            displayName: 'Username',
            description: 'Username for the new user',
            required: true,
        }),
        userType: Property.StaticDropdown({
            displayName: 'User Type',
            description: 'Type of user',
            required: true,
            defaultValue: 'EPVUser',
            options: {
                disabled: false,
                options: [
                    { label: 'EPV User', value: 'EPVUser' },
                    { label: 'Basic User', value: 'BasicUser' },
                    { label: 'External User', value: 'ExtUser' },
                ],
            },
        }),
        userFields: Property.DynamicProperties({
            displayName: 'User Fields',
            description: 'Additional user fields based on user type',
            required: true,
            refreshers: ['userType'],
            props: async ({ userType }) => {
                if (!userType) {
                    return {};
                }
                return getFieldsForUserType(userType as unknown as string);
            },
        }),
    },
    async run(context) {
        const { username, userType, userFields } = context.propsValue;

        if (!username || !userType) {
            throw new Error('Username and user type are required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            const userData: any = {
                username,
                userType,
            };

            const fields = userFields || {};
            Object.entries(fields).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'changePasswordOnNextLogon') {
                        userData.changePasswordOnTheNextLogon = value;
                    } else {
                        userData[key] = value;
                    }
                }
            });

            const response = await client.makeRequest('/Users', HttpMethod.POST, userData);

            return {
                success: true,
                message: `User ${username} created successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to create user ${username}`
            );
        }
    },
});
