import { Platform, PlatformId, ProjectMemberStatus } from '@activepieces/shared'
import { PrincipalType, Project, isNil, User, ActivepiecesError, ErrorCode, ApEdition, PlatformRole } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { projectMemberService } from '../../../project-members/project-member.service'
import { projectService } from '../../../../project/project-service'
import { getEdition } from '../../../../helper/secret-helper'
import { userService } from '../../../../user/user-service'
import { flagService } from '../../../../flags/flag.service'

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

const populateTokenWithPlatformInfo = async ({ user, project }: PopulateTokenWithPlatformInfoParams): Promise<string> => {
    const platform = await getPlatform(user.platformId)
    const updatedToken = await accessTokenManager.generateToken({
        id: user.id,
        type: PrincipalType.USER,
        projectId: project.id,
        projectType: project.type,
        platform: isNil(platform) ? undefined : {
            id: platform.id,
            role: platform.ownerId === user.id ? PlatformRole.OWNER : PlatformRole.MEMBER,
        },
    })

    return updatedToken
}

const getPlatform = async (platformId: PlatformId | null): Promise<Platform | null> => {
    if (isNil(platformId)) {
        return null
    }

    return platformService.getOne(platformId)
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
    const activeInAnyProject = !isNil(projects.find(f => f.status === ProjectMemberStatus.ACTIVE))
    if (activeInAnyProject) {
        await userService.verify({
            id: user.id,
        })
        return
    }
}

async function getProjectAndTokenOrThrow(user: User): Promise<{ project: Project, token: string }> {
    const project = await getProjectForUserOrThrow(user)
    return {
        project,
        token: await populateTokenWithPlatformInfo({ user, project }),
    }
}

async function isInvitedToProject({ email, platformId }: { email: string, platformId: string }): Promise<boolean> {
    const platformProjects = await projectMemberService.listByUser({
        email,
        platformId,
    })
    return platformProjects.length > 0
}

async function assertUserIsInvitedToAnyProject({ email, platformId }: { email: string, platformId: string }): Promise<void> {
    const isInvited = await isInvitedToProject({ email, platformId })
    if (!isInvited) {
        throw new ActivepiecesError({
            code: ErrorCode.INVITATION_ONLY_SIGN_UP,
            params: {},
        })
    }
}

async function assertEmailAuthIsEnabled({ platformId }: { platformId: string | null }): Promise<void> {
    if (isNil(platformId)) {
        return
    }
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.ssoEnabled) {
        return
    }
    if (!platform.emailAuthEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.EMAIL_AUTH_DISABLED,
            params: {},
        })
    }
}

async function assertDomainIsAllowed({ email, platformId }: { email: string, platformId: string | null }): Promise<void> {
    if (isNil(platformId)) {
        return
    }
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.ssoEnabled) {
        return
    }
    const emailDomain = email.split('@')[1]
    const isAllowedDomaiin = !platform.enforceAllowedAuthDomains || platform.allowedAuthDomains.includes(emailDomain)

    if (!isAllowedDomaiin) {
        throw new ActivepiecesError({
            code: ErrorCode.DOMAIN_NOT_ALLOWED,
            params: {
                domain: emailDomain,
            },
        })
    }
}

async function assertUserIsInvitedAndDomainIsAllowed({ email, platformId }: { email: string, platformId: string | null }): Promise<void> {
    await assertDomainIsAllowed({ email, platformId })
    const customerPlatformEnabled = !isNil(platformId) && !flagService.isCloudPlatform(platformId)
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


