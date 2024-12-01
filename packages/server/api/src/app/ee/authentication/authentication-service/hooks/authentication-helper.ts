import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    PrincipalType,
    Project,
    User,
} from '@activepieces/shared'
import { Provider } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { flagService } from '../../../../flags/flag.service'
import { platformService } from '../../../../platform/platform.service'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { userInvitationsService } from '../../../../user-invitations/user-invitation.service'
import { platformProjectService } from '../../../projects/platform-project-service'

async function getProjectForUserOrThrow(user: User): Promise<Project> {
    const invitedProject = await getProjectMemberOrThrow(user)
    if (!isNil(invitedProject)) {
        return invitedProject
    }
    throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
            entityType: 'project',
            message: `no projects found for the user=${user.id}`,
        },
    })
}

const getProjectMemberOrThrow = async (user: User): Promise<Project | null> => {
    const { platformId } = user
    assertNotNullOrUndefined(platformId, 'platformId')
    const platformProjects = await platformProjectService.getAll({
        principalType: PrincipalType.USER,
        principalId: user.id,
        platformId,
        cursorRequest: null,
        limit: 1,
    })

    if (platformProjects.data.length === 0) {
        return null
    }

    return projectService.getOneOrThrow(platformProjects.data[0].id)
}

const populateTokenWithPlatformInfo = async ({
    user,
    project,
}: PopulateTokenWithPlatformInfoParams): Promise<string> => {
    const platform = await platformService.getOneOrThrow(project.platformId)
    const updatedToken = await accessTokenManager.generateToken({
        id: user.id,
        type: PrincipalType.USER,
        projectId: project.id,
        platform: {
            id: platform.id,
        },
        tokenVersion: user.tokenVersion,
    })

    return updatedToken
}

type PopulateTokenWithPlatformInfoParams = {
    user: User
    project: Project
}

async function autoVerifyUserIfEligible(user: User): Promise<void> {
    assertNotNullOrUndefined(user.platformId, 'platformId')
    const isInvited = await userInvitationsService.hasAnyAcceptedInvitations({
        platformId: user.platformId,
        email: user.email,
    })
    if (isInvited) {
        await userService.verify({
            id: user.id,
        })
        return
    }
}

async function getProjectAndTokenOrThrow(
    user: User,
): Promise<{ project: Project, token: string }> {
    const project = await getProjectForUserOrThrow(user)

    const token = await populateTokenWithPlatformInfo({
        user,
        project,
    })
    return {
        project,
        token,
    }
}



async function assertEmailAuthIsEnabled({
    platformId,
    provider,
}: {
    platformId: string | null
    provider: Provider
}): Promise<void> {
    if (isNil(platformId)) {
        return
    }
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.ssoEnabled) {
        return
    }
    if (provider !== Provider.EMAIL) {
        return
    }
    if (!platform.emailAuthEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.EMAIL_AUTH_DISABLED,
            params: {},
        })
    }
}

async function assertDomainIsAllowed({
    email,
    platformId,
}: {
    email: string
    platformId: string | null
}): Promise<void> {
    if (isNil(platformId)) {
        return
    }
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.ssoEnabled) {
        return
    }
    const emailDomain = email.split('@')[1]
    const isAllowedDomaiin =
        !platform.enforceAllowedAuthDomains ||
        platform.allowedAuthDomains.includes(emailDomain)

    if (!isAllowedDomaiin) {
        throw new ActivepiecesError({
            code: ErrorCode.DOMAIN_NOT_ALLOWED,
            params: {
                domain: emailDomain,
            },
        })
    }
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
            params: {},
        })
    }
}


async function assertUserIsInvitedAndDomainIsAllowed({
    email,
    platformId,
}: {
    email: string
    platformId: string | null
}): Promise<void> {
    await assertDomainIsAllowed({ email, platformId })
    const customerPlatformEnabled =
        !isNil(platformId) && !flagService.isCloudPlatform(platformId)
    if (customerPlatformEnabled) {
        await assertUserIsInvitedToPlatformOrProject({ email, platformId })
    }
}

export const authenticationHelper = {
    getProjectAndTokenOrThrow,
    autoVerifyUserIfEligible,
    assertUserIsInvitedAndDomainIsAllowed,
    assertDomainIsAllowed,
    assertEmailAuthIsEnabled,
}
