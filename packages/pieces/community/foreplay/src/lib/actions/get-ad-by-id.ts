import { createAction, Property } from '@activepieces/pieces-framework';
// FIX: Removed the non-existent 'ErrorMessages' import
import { HttpMethod, httpClient, HttpError } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';

export const getAdById = createAction({
    auth: foreplayAuth,
    name: 'get_ad_by_id',
    displayName: 'Get Ad by ID',
    description: 'Retrieve detailed information about a specific ad given its unique ad ID.',
    props: {
        ad_id: Property.ShortText({
            displayName: 'Ad ID',
            description: 'The unique identifier of the ad to retrieve (e.g., "ad_1234567890").',
            required: true,
        }),
    },
    async run(context) {
        const ad_id = context.propsValue['ad_id'] as string;
        const { apiKey } = context.auth;

        if (!ad_id || ad_id.trim() === '') {
            throw new Error('Ad ID is required. Please provide a valid Ad ID.');
        }

        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://public.api.foreplay.co/api/ad/${ad_id}`,
                headers: {
                    'Authorization': apiKey
                }
            });
            return response.body['data'];
        } catch (error) {
            const httpError = error as HttpError;
            
            
            const errorBody = httpError.response.body as any;
            
            
            const errorMessage = errorBody?.error?.message ?? `An unexpected error occurred: ${httpError.response.status}`;
            
            throw new Error(errorMessage);
        }
    },
});