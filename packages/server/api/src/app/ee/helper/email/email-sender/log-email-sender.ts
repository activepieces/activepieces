import { EmailSender } from './email-sender'
import { logger } from '@activepieces/server-shared'

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
