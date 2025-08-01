import { assertNotNullOrUndefined, InvitationType, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { projectRoleService } from '../project-role/project-role.service'
import { emailSender } from './sender'

export const emailService = (log: FastifyBaseLogger) => ({
    async sendInvitation(invitation: UserInvitationWithLink): Promise<void> {
        const { email, platformId } = invitation
        const name = await getEntityNameForInvitation(invitation)
        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'invitation-email',
                vars: {
                    projectOrPlatformName: name,
                    invitationLink: invitation.link!,
                },
            },
        })
    },
})

async function getEntityNameForInvitation(userInvitation: UserInvitation): Promise<string> {
    switch (userInvitation.type) {
        case InvitationType.PLATFORM: {
            const platform = await platformService.getOneOrThrow(userInvitation.platformId)
            assertNotNullOrUndefined(userInvitation.platformRole, 'platformRole')
            return platform.name
        }
        case InvitationType.PROJECT: {
            assertNotNullOrUndefined(userInvitation.projectId, 'projectId')
            assertNotNullOrUndefined(userInvitation.projectRoleId, 'projectRoleId')
            // check if role is present or throw
            await projectRoleService.getById({
                id: userInvitation.projectRoleId,
            })
            const project = await projectService.getOneOrThrow(userInvitation.projectId)
            return project.displayName
        }
    }
}
