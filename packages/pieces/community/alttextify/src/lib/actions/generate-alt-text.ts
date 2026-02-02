import { createAction, Property } from "@activepieces/pieces-framework";
import { alttextifyAuth } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import mime from 'mime-types';

export const generateAltTextAction = createAction({
    name: 'generate-alt-text',
    auth: alttextifyAuth,
    displayName: 'Generate Image Alt Text',
    description: 'Generates alt text for specified image.',
    props: {
        image: Property.File({
            displayName: 'Image File',
            required: true
        }),
        lang: Property.ShortText({
            displayName: 'Language',
            required: false,
            defaultValue: 'en',
            description: 'Specifies the language for the alt text. Supported language codes are accepted.'
        }),
        keywords: Property.Array({
            displayName: 'Keywords',
            required: false,
            description: 'List of keywords/phrases for SEO-optimized alt text.'
        }),
        negative_keywords: Property.Array({
            displayName: 'Negative Keywords',
            required: false,
            description: 'List of negative keywords/phrases for SEO-optimized alt text.'
        })
    },
    async run(context) {

        const { image, keywords, negative_keywords, lang } = context.propsValue;

        const fileType = image.extension
      ? mime.lookup(image.extension)
      : 'image/jpeg';

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.alttextify.net/api/v1/image/raw',
            headers: {
                'X-API-Key': context.auth.secret_text
            },
            body: {
                async: false,
                image: `data:${fileType};base64,${image.base64}`,
                lang,
                keywords,
                negative_keywords
            }
        })

        return response.body;

    }
})