import { ActivepiecesError, ApFlagId, assertNotNullOrUndefined, ErrorCode, isNil, PrincipalType, Project, ProjectRole, User } from '@activepieces/shared'
import { projectMemberService } from '../../../ee/project-members/project-member.service'
import { flagService } from '../../../flags/flag.service'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { accessTokenManager } from '../../lib/access-token-manager'
import { AuthenticationServiceHooks } from './authentication-service-hooks'

const DEFAULT_PLATFORM_NAME = 'platform'

export const communityAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn() {
        // Empty
    },
    async preSignUp({ email, platformId }) {
        const userCreated = await flagService.getOne(ApFlagId.USER_CREATED)
        if (userCreated?.value) {
            assertNotNullOrUndefined(platformId, 'platformId')
            await assertUserIsInvitedToPlatformOrProject({ email, platformId })
        }
    },
    async postSignUp({ user }) {
        const platformCreated = await platformService.hasAnyPlatforms()
        if (platformCreated) {
            assertNotNullOrUndefined(user.platformId, 'user.platformId')
            await userInvitationsService.provisionUserInvitation({
                email: user.email,
                platformId: user.platformId,
            })
            return getProjectAndToken(user)
        }
        const platform = await platformService.create({
            ownerId: user.id,
            name: DEFAULT_PLATFORM_NAME,
        })
        await projectService.create({
            displayName: `${user.firstName}'s Project`,
            ownerId: user.id,
            platformId: platform.id,
        })
        return getProjectAndToken(user)
    },

    async postSignIn({ user }) {
        return getProjectAndToken(user)
    },
}



async function assertUserIsInvitedToPlatformOrProject({
    email,
    platformId,
}: {
    email: string
    platformId: string
}): Promise<void> {
    const isInvited = await userInvitationsService.hasAnyAcceptedInvitations({
        platformId,
        email,
    })
    if (!isInvited) {
        throw new ActivepiecesError({
            code: ErrorCode.INVITATION_ONLY_SIGN_UP,
            params: {
                message: 'User is not invited to the platform',
            },
        })
    }
}

async function getProjectAndToken(user: User): Promise<{ user: User, project: Project, token: string, projectRole: ProjectRole }> {
    const updatedUser = await userService.getOneOrFail({ id: user.id })

    const project = await projectService.getOneForUser(updatedUser)
    if (isNil(project)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVITATION_ONLY_SIGN_UP,
            params: {
                message: 'No project found for user',
            },
        })
    }
    const platform = await platformService.getOneOrThrow(project.platformId)
    const token = await accessTokenManager.generateToken({
        id: user.id,
        type: PrincipalType.USER,
        projectId: project.id,
        platform: {
            id: platform.id,
        },
        tokenVersion: user.tokenVersion,
    })
    const projectRole = await projectMemberService.getRole({ userId: user.id, projectId: project.id })

    if (isNil(projectRole)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVITATION_ONLY_SIGN_UP,
            params: {
                message: 'No project role found for user',
            },
        })
    }
    return {
        user: updatedUser,
        token,
        project,
        projectRole,
    }
}
