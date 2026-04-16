import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { BASE_URL, detectingAiAuth } from '../common'

export const detectAiContent = createAction({
    name: 'detect_ai_content',
    displayName: 'Detect AI Content',
    description: 'Detect AI-generated content in text',
    auth: detectingAiAuth,
    requireAuth: true,
    props: {
        text: Property.LongText({
            displayName: 'Text',
            required: true,
        }),
        version: Property.StaticDropdown({
            displayName: 'Version',
            required: true,
            options: {
                options: [
                    {
                        label: 'v1',
                        value: 'v1',
                    },
                    {
                        label: 'v2',
                        value: 'v2',
                    },
                ],
            },
            defaultValue: 'v2',
        }),
    },
    async run({ auth, propsValue }) {
        const apiKey = auth.secret_text

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/api/detect/`,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: {
                text: propsValue.text,
                version: propsValue.version,
            },
        })

        return response.body
    },
})
