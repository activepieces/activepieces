import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getUpdateFields = (): DynamicPropsValue => {
    return {
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
        disabled: Property.Checkbox({
            displayName: 'Disabled',
            description: 'Disable or enable user',
            required: false,
        }),
        location: Property.ShortText({
            displayName: 'Location',
            description: 'User location',
            required: false,
        }),
    };
};

export const updateUser = createAction({
    auth: cyberarkAuth,
    name: 'update_user',
    displayName: 'Update User',
    description: 'Updates an existing user in CyberArk',
    props: {
        userId: userIdDropdown,
        userFields: Property.DynamicProperties({
            displayName: 'User Fields',
            description: 'Fields to update',
            required: true,
            refreshers: [],
            props: async () => {
                return getUpdateFields();
            },
        }),
    },
    async run(context) {
        const { userId, userFields } = context.propsValue;

        if (!userId) {
            throw new Error('User ID is required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            const updateData: any = {};
            const fields = userFields || {};

            Object.entries(fields).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'changePasswordOnNextLogon') {
                        updateData.changePasswordOnTheNextLogon = value;
                    } else {
                        updateData[key] = value;
                    }
                }
            });

            if (Object.keys(updateData).length === 0) {
                throw new Error('At least one field must be provided to update');
            }

            const response = await client.makeRequest(
                `/Users/${userId}`,
                HttpMethod.PUT,
                updateData
            );

            return {
                success: true,
                message: `User ${userId} updated successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to update user ${userId}`
            );
        }
    },
});
