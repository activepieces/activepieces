import { UserInvitation } from '@activepieces/shared'
import { hooksFactory } from './hooks-factory'

export type EmailServiceHooks = {
    sendInvitation(args: { userInvitation: UserInvitation, invitationLink: string }): Promise<void>
    sendProjectMemberAdded(args: { userInvitation: UserInvitation }): Promise<void>
}

export const emailServiceHooks = hooksFactory.create<EmailServiceHooks>(_log => ({
    async sendInvitation(_args: { userInvitation: UserInvitation, invitationLink: string }): Promise<void> {
        return
    },
    async sendProjectMemberAdded(_args: { userInvitation: UserInvitation }): Promise<void> {
        return
    },
}))
