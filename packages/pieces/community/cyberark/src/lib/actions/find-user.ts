import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";

export const findUser = createAction({
    name: 'find_user',
    displayName: 'Find User',
    description: 'Finds users based on various filter criteria.',
    auth: cyberarkAuth,
    props: {
        search: Property.ShortText({
            displayName: 'Search',
            description: 'A keyword to search for in username, first name, and last name.',
            required: false,
        }),
        userType: Property.StaticDropdown({
            displayName: 'User Type',
            description: 'Filter users by a specific type.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'EPV User', value: 'EPVUser' },
                ],
            }
        }),
        extendedDetails: Property.Checkbox({
            displayName: 'Include Extended Details',
            description: 'If checked, the response will include extra details like group memberships.',
            required: false,
            defaultValue: false,
        })
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);

        const queryParams: Record<string, string> = {};


        if (propsValue['search']) {
            queryParams['search'] = propsValue['search'] as string;
        }

        if (propsValue['userType']) {
            queryParams['filter'] = `userType eq ${propsValue['userType']}`;
        }

        if (propsValue['extendedDetails']) {
            queryParams['ExtendedDetails'] = 'true';
        }

        return await client.makeRequest(
            HttpMethod.GET,
            '/PasswordVault/API/Users',
            undefined, 
            queryParams
        );
    },
});