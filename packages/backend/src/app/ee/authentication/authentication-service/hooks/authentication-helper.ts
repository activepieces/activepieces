import { Platform, PlatformId, ProjectMemberStatus } from '@activepieces/ee-shared'
import { PrincipalType, Project, isNil, User, ActivepiecesError, ErrorCode, ApEdition } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { projectMemberService } from '../../../project-members/project-member.service'
import { projectService } from '../../../../project/project-service'
import { getEdition } from '../../../../helper/secret-helper'
import { userService } from '../../../../user/user-service'

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
            role: platform.ownerId === user.id ? 'OWNER' : 'MEMBER',
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

async function autoVerifyUserIfEligible(user: User): Promise<User> {
    const edition = getEdition()
    if (edition === ApEdition.ENTERPRISE) {
        return userService.verify({ id: user.id })
    }
    const projects = await projectMemberService.listByUser(user)
    const activeInAnyProject = !isNil(projects.find(f => f.status === ProjectMemberStatus.ACTIVE))
    if (activeInAnyProject) {
        return userService.verify({
            id: user.id,
        })
    }
    return user
}

async function getProjectAndTokenOrThrow(user: User): Promise<{ project: Project, token: string }> {
    const project = await getProjectForUserOrThrow(user)
    return {
        project,
        token: await populateTokenWithPlatformInfo({ user, project }),
    }
}

export const authenticationHelper = {
    getProjectAndTokenOrThrow,
    autoVerifyUserIfEligible,
}
