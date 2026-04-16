import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { BASE_URL, detectingAiAuth } from '../common'

export const checkPlagiarism = createAction({
    name: 'check_plagiarism',
    displayName: 'Check Plagiarism',
    description: 'Check text for plagiarism',
    auth: detectingAiAuth,
    requireAuth: true,
    props: {
        text: Property.LongText({
            displayName: 'Text',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const apiKey = auth.secret_text

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/api/plagiarism/`,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: {
                text: propsValue.text,
            },
        })

        return response.body
    },
})
