import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment, EmailSender } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { dummyEmailSender } from './dummy'
import { smtpEmailSender } from './smtp'

const getEmailSender = (log: FastifyBaseLogger): EmailSender => {
    const env = system.get(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.PRODUCTION) {
        return smtpEmailSender(log)
    }

    return dummyEmailSender(log)
}

export const emailSender = (log: FastifyBaseLogger): EmailSender => getEmailSender(log)
