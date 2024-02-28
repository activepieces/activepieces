import { logger } from 'server-shared'
import { EmailSender } from './email-sender'

/**
 * Logs sent emails to the console
 */
export const logEmailSender: EmailSender = {
    async send({ email, platformId, templateData }) {
        logger.debug({
            name: 'LogEmailSender#send',
            email,
            platformId,
            templateData,
        })
    },
}
