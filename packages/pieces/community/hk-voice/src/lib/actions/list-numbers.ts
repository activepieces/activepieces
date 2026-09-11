import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';

export const listNumbersAction = createAction({
    auth: hkVoiceAuth,
    name: 'list_numbers',
    classification: 'READ',
    displayName: 'List Phone Numbers',
    description: 'Lists Voice phone numbers for the organization.',
    audience: 'both',
    aiMetadata: {
        description: 'Lists Voice phone numbers (caller IDs) available to the API key.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.phoneNumbers,
            query: { limit: 200, offset: 0 },
        });
        return {
            phone_numbers: hkVoiceApi.extractList({
                body,
                collectionKeys: ['results', 'phone_numbers'],
            }),
        };
    },
});
