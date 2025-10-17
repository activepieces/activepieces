import { createAction } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userSearchProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUser = createAction({
    auth: cyberarkAuth,
    name: 'find_user',
    displayName: 'Find User',
    description: 'Finds users based on filter criteria',
    props: userSearchProps,
    async run(context) {
        const { searchField, searchValue } = context.propsValue;

        if (!searchField || !searchValue) {
            throw new Error('Search field and search value are required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            const searchParams = new URLSearchParams();
            searchParams.append('filter', searchField);
            searchParams.append('search', searchValue);

            const response = await client.makeRequest<{ Users: any[] }>(
                `/Users?${searchParams.toString()}`,
                HttpMethod.GET
            );

            return {
                users: response.Users || [],
                count: response.Users?.length || 0,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to search users'
            );
        }
    },
});
