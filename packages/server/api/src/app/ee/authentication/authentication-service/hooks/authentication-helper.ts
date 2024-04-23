import { Provider } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { flagService } from '../../../../flags/flag.service'
import { getEdition } from '../../../../helper/secret-helper'
import { platformService } from '../../../../platform/platform.service'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { projectMemberService } from '../../../project-members/project-member.service'
import {
    ProjectMemberStatus,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    isNil,
    PrincipalType,
    Project,
    ProjectMemberRole,
    User,
} from '@activepieces/shared'

async function getProjectForUserOrThrow(user: User): Promise<Project> {
    const invitedProject = await getProjectMemberOrThrow(user)
    if (isNil(invitedProject)) {
        const ownerProject = await projectService.getUserProject(user.id)
        if (isNil(ownerProject)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    message: `no projects found for the user=${user.id}`,
                },
            })
        }
        return ownerProject
    }
    return invitedProject
}

const getProjectMemberOrThrow = async (user: User): Promise<Project | null> => {
    const platformProjects = await projectMemberService.listByUser(user)

    if (platformProjects.length === 0) {
        return null
    }

    return projectService.getOneOrThrow(platformProjects[0].projectId)
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
    })

    return updatedToken
}

type PopulateTokenWithPlatformInfoParams = {
    user: User
    project: Project
}

async function autoVerifyUserIfEligible(user: User): Promise<void> {
    const edition = getEdition()
    if (edition === ApEdition.ENTERPRISE) {
        await userService.verify({ id: user.id })
        return
    }
    const projects = await projectMemberService.listByUser(user)
    const activeInAnyProject = !isNil(
        projects.find((f) => f.status === ProjectMemberStatus.ACTIVE),
    )
    if (activeInAnyProject) {
        await userService.verify({
            id: user.id,
        })
        return
    }
}

async function getProjectAndTokenOrThrow(
    user: User,
): Promise<{ project: Project, token: string, projectRole: ProjectMemberRole | null }> {
    const project = await getProjectForUserOrThrow(user)

    const projectRole = await projectMemberService.getRole({
        projectId: project.id,
        userId: user.id,
    })

    const token = await populateTokenWithPlatformInfo({
        user,
        project,
    })

    return {
        project,
        projectRole,
        token,
    }
}

async function isInvitedToProject({
    email,
    platformId,
}: {
    email: string
    platformId: string
}): Promise<boolean> {
    const platformProjects = await projectMemberService.listByUser({
        email,
        platformId,
    })
    return platformProjects.length > 0
}

async function assertUserIsInvitedToAnyProject({
    email,
    platformId,
}: {
    email: string
    platformId: string
}): Promise<void> {
    const isInvited = await isInvitedToProject({ email, platformId })
    if (!isInvited) {
        throw new ActivepiecesError({
            code: ErrorCode.INVITATION_ONLY_SIGN_UP,
            params: {},
        })
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
        await assertUserIsInvitedToAnyProject({ email, platformId })
    }
}

export const authenticationHelper = {
    getProjectAndTokenOrThrow,
    autoVerifyUserIfEligible,
    assertUserIsInvitedAndDomainIsAllowed,
    assertDomainIsAllowed,
    assertEmailAuthIsEnabled,
}
