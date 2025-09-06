import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { murfAuth } from '../../index';
import { murfCommon, MURF_API_URL } from '../common/props';

export const translateText = createAction({
    auth: murfAuth,
    name: 'translate_text',
    displayName: 'Translate Text',
    description: 'Translates provided text.',
    props: {
        texts: Property.Array({
            displayName: 'Texts to Translate',
            description: 'The text inputs to be translated.',
            required: true,
        }),
        targetLanguage: murfCommon.targetLanguage(true),
    },
    async run({ auth, propsValue }) {
        const { texts, targetLanguage } = propsValue as {
            texts: string[];
            targetLanguage: string;
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${MURF_API_URL}/text/translate`,
            headers: {
                'Content-Type': 'application/json',
                'api-key': auth,
            },
            body: {
                texts,
                targetLanguage,
            },
        });

        return response.body;
    },
});