import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';

export const getBitlinkDetailsAction = createAction({
    auth: bitlyAuth,
    name: 'get_bitlink_details',
    displayName: 'Get Bitlink Details',
    description: 'Retrieve metadata for a Bitlink.',
    props: {
        group_guid: groupGuid,
        bitlink: bitlinkDropdown,
    },
    async run(context) {
        const { bitlink } = context.propsValue;

        try {
            return await bitlyApiCall({
                method: HttpMethod.GET,
                auth: context.auth,
                resourceUri: `/bitlinks/${bitlink}`,
            });

        } catch (error: any) {
            const errorMessage = error.response?.data?.description || error.response?.data?.message || error.message;

            if (error.response?.status === 429) {
                throw new Error(
                    'Rate limit exceeded. Please wait before trying again.'
                );
            }

            if (error.response?.status === 404) {
                throw new Error(
                    `Bitlink not found: ${errorMessage}. Please verify the link ID is correct.`
                );
            }

            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error(
                    `Authentication failed or forbidden: ${errorMessage}. Please check your Access Token and permissions.`
                );
            }

            throw new Error(
                `Failed to get Bitlink details: ${errorMessage || 'Unknown error occurred'}`
            );
        }
    },
});
