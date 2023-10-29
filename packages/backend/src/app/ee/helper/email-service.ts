
import sendgrid from '@sendgrid/mail'
import { logger } from '@sentry/utils'
import { tokenUtils } from '../../authentication/lib/token-utils'
import { getEdition } from '../../helper/secret-helper'
import { ApEdition, Principal } from '@activepieces/shared'

export const emailService = {
    async sendInvitationEmail({ email, invitationId }: { email: string, invitationId: string }): Promise<void> {
        const edition = getEdition()
        if (edition !== ApEdition.CLOUD) {
            return
        }

        const token = await tokenUtils.encode({
            id: invitationId,
        } as Principal)

        sendgrid.send({
            to: email,
            from: {
                email: 'notifications@activepieces.com',
                name: 'Activepieces',
            },
            templateId: 'd-be9336168db241bc8b63bd5dd07e8983',
            dynamicTemplateData: {
                setup_link: `https://cloud.activepieces.com/invitation?token=${token}`,
            },
        }).catch((e) => logger.error(e, '[ProjectMemberService#send] sendgrid.send'))
    },
}
