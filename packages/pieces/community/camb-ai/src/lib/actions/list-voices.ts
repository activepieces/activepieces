import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL } from '../common';

export const listVoices = createAction({
    auth: cambaiAuth,
    name: 'list_voices',
    displayName: 'List Voices',
    description: 'Retrieve a list of all available voices.',
    props: {},
    async run(context) {
        const { auth } = context;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/list-voices`,
            headers: { 'x-api-key': auth.secret_text },
        });

        return response.body;
    },
});
