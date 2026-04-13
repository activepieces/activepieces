import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { triggers } from './lib/triggers'
import { SURVEYTALE_BASE_URL, surveyTaleAuth } from './lib/auth'

export const surveytale = createPiece({
    displayName: 'SurveyTale',
    description: 'Experience management platform for surveys and feedback',
    auth: surveyTaleAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/surveytale.png',
    categories: [PieceCategory.BUSINESS_INTELLIGENCE,PieceCategory.FORMS_AND_SURVEYS],
    authors: ['nag381'],
    actions: [
        createCustomApiCallAction({
            auth: surveyTaleAuth,
            authMapping: async (auth) => {
                return {
                    'x-api-key': auth.secret_text as string,
                }
            },
            baseUrl: () => `${SURVEYTALE_BASE_URL}/api/v1`,
        }),
    ],
    triggers,
})
