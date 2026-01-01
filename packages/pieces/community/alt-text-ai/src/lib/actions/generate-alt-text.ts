import { createAction, Property } from "@activepieces/pieces-framework";
import { altTextAiAuth } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const generateAltTextAction = createAction({
    name: 'generate-alt-text',
    auth: altTextAiAuth,
    displayName: 'Generate Alt Text',
    description: 'Generates a descriptive alt text for a given image.',
    props: {
        image: Property.File({
            displayName: 'Image',
            required: true
        }),
        keywords: Property.Array({
            displayName: 'Keywords',
            required: false,
            description: 'keywords / phrases to be considered when generating the alt text.'
        }),
        negativeKeywords: Property.Array({
            displayName: 'Negative Keywords',
            required: false,
            description: 'negative keywords / phrases to be removed from any generated alt text.'
        }),
        keywordSource: Property.LongText({
            displayName: 'Keyword Source',
            required: false,
            description: 'Text to use as the source of keywords for the alt text.'
        })
    },
    async run(context) {
        const { image, keywords, keywordSource, negativeKeywords } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: BASE_URL + '/images',
            headers: {
                'X-API-Key': context.auth.secret_text
            },
            body: {
                image: {
                    raw: image.base64
                },
                keywords,
                keyword_source: keywordSource,
                negative_keywords: negativeKeywords
            }
        })

        return response.body;
    }
})