import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { sendItAuth } from '../auth'
import {
    mediaTypeProperty,
    mediaUrlProperty,
    mediaUrlsProperty,
    platformProperty,
    sendItRequest,
    textProperty,
} from '../common'

export const validateContent = createAction({
    auth: sendItAuth,
    name: 'validate_content',
    displayName: 'Validate Content',
    description: 'Check if content meets platform requirements before publishing',
    props: {
        platforms: platformProperty,
        text: textProperty,
        mediaUrl: mediaUrlProperty,
        mediaUrls: mediaUrlsProperty,
        mediaType: mediaTypeProperty,
    },
    async run(context) {
        const { platforms, text, mediaUrl, mediaUrls, mediaType } = context.propsValue

        return await sendItRequest(context.auth.secret_text, HttpMethod.POST, '/validate', {
            platforms,
            content: {
                text,
                mediaUrl,
                mediaUrls,
                mediaType,
            },
        })
    },
})
