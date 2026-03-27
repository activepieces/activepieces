import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { PieceAuth } from '@activepieces/pieces-framework'

const authDesc = `
  **How to get your API Key:**
  1. Login to your SurveyTale account.
  2. On the bottom-left, click on your account dropdown.
  3. Select 'Organization' from the popup menu.
  4. Select the 'API Keys' tab.
  5. Click on 'Add API Key'.
  6. On the popup form, enter the 'API Key Label' and under Project Access click "Add Permission", select the desired project and assign "Read" permission.
  7. Copy the API key and paste it below.
`

export const surveyTaleAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: authDesc,
    validate: async ({ auth }) => {
        try {
            const apiKey = auth as string

            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${SURVEYTALE_BASE_URL}/api/v1/management/me`,
                headers: {
                    'x-api-key': apiKey,
                },
            })

            return {
                valid: true,
            }
        } catch (error) {
            return {
                valid: false,
                error: 'Please check your API key',
            }
        }
    },
})

export const SURVEYTALE_BASE_URL = 'https://app.surveytale.com'
