import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addContact } from './lib/actions/add-contact'
import { sendANewSms } from './lib/actions/send-a-new-sms'
import { octopushAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'

export const octopushSms = createPiece({
    displayName: 'Octopush SMS',
    auth: octopushAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/octopush-sms.png',
    description:
        'Send bulk messaging for your promotions, order tracking, appointment reminders, voice messages, one-time passwords (OTP), 2-way chat sms and much more!',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.COMMUNICATION],
    actions: [
        addContact,
        sendANewSms,
        createCustomApiCallAction({
            auth: octopushAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'api-key': auth.props.api_key,
                    'api-login': auth.props.api_login,
                }
            },
        }),
    ],
    triggers: [],
})
