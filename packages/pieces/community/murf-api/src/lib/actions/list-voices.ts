import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { murfAuth } from '../../index';
import { MURF_API_URL } from '../common/props';

export const listVoices = createAction({
    auth: murfAuth,
    name: 'list_voices',
    displayName: 'List Voices',
    description: 'Lists all the voices.',
    props: {}, 
    async run({ auth }) {
        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.GET,
            url: `${MURF_API_URL}/speech/voices`,
            headers: {
                'api-key': auth,
            },
        });
        return response.body;
    },
});