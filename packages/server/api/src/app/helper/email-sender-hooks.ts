import { isNil } from '@activepieces/shared'
import { hooksFactory } from './hooks-factory'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export type EmailSenderHooks = {
    isSmtpConfigured(): boolean
}

export const emailSenderHooks = hooksFactory.create<EmailSenderHooks>(_log => ({
    isSmtpConfigured(): boolean {
        return [AppSystemProp.SMTP_HOST, AppSystemProp.SMTP_PORT, AppSystemProp.SMTP_USERNAME, AppSystemProp.SMTP_PASSWORD]
            .every(prop => !isNil(system.get(prop)))
    },
}))
