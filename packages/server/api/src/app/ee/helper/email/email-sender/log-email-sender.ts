import { logger } from '@activepieces/server-shared'
import { EmailSender } from './email-sender'

/**
 * Logs sent emails to the console
 */
export const logEmailSender: EmailSender = {
    async send({ emails, platformId, templateData }) {
        logger.debug({
            name: 'LogEmailSender#send',
            emails,
            platformId,
            templateData,
        })
    },
}
