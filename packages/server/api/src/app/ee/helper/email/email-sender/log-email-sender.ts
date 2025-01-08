import { FastifyBaseLogger } from 'fastify'
import { EmailSender } from './email-sender'

/**
 * Logs sent emails to the console
 */
export const logEmailSender = (log: FastifyBaseLogger): EmailSender => {
    return {
        async send({ emails, platformId, templateData }) {
            log.debug({
                name: 'LogEmailSender#send',
                emails,
                platformId,
                templateData,
            })
        },
    }
}
