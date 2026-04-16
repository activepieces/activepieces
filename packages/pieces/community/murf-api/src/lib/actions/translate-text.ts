import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { murfAuth } from '../common/auth'
import { makeRequest } from '../common/client'
import { murfCommon } from '../common/dropdown'

export const translateText = createAction({
    auth: murfAuth,
    name: 'translateText',
    displayName: 'Translate Text',
    description: 'Translate one or more texts to the target language.',
    props: {
        targetLanguage: murfCommon.language,
        texts: Property.Array({
            displayName: 'Texts',
            description: 'List of texts to translate',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const response = await makeRequest(auth.secret_text, HttpMethod.POST, '/text/translate', {
            target_language: propsValue.targetLanguage,
            texts: propsValue.texts,
        })

        return response
    },
})
