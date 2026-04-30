import { Property } from '@activepieces/pieces-framework'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { SURVEYTALE_BASE_URL, surveyTaleAuth } from '../auth'

export const surveyIdProp = Property.MultiSelectDropdown({
    displayName: 'Survey',
    description: 'A selection of surveys that will trigger. Else, all surveys will trigger.',
    required: true,
    refreshers: [],
    auth: surveyTaleAuth,
    options: async ({ auth }) => {
        if (!auth) {
            return {
                options: [],
                disabled: true,
                placeholder: 'Please authenticate first',
            }
        }

        const apiKey = auth.secret_text as string

        try {
            const response = await httpClient.sendRequest<{ data: Survey[] }>({
                method: HttpMethod.GET,
                url: `${SURVEYTALE_BASE_URL}/api/v1/management/surveys`,
                headers: {
                    'x-api-key': apiKey,
                },
            })
            return {
                disabled: false,
                options: response.body.data.map((survey) => ({
                    label: survey.name,
                    value: survey.id,
                })),
            }
        } catch (error) {
            return {
                options: [],
                disabled: true,
                placeholder: `Couldn't load Surveys:\n${error}`,
            }
        }
    },
})

interface Survey {
    id: string
    name: string
}
