import { Platform, PlatformId } from '@activepieces/ee-shared'
import { PrincipalType, Project, isNil, User, ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { projectMemberService } from '../../../project-members/project-member.service'
import { projectService } from '../../../../project/project-service'


async function getProjectForUserOrThrow(userId: string): Promise<Project> {
    const invitedProject = await getProjectMemberOrThrow(userId)
    if (isNil(invitedProject)) {
        const ownerProject = await projectService.getUserProject(userId)
        if (isNil(ownerProject)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    message: `no projects found for the user=${userId}`,
                },
            })
        }
        return ownerProject
    }
    return invitedProject
}

const getProjectMemberOrThrow = async (userId: string): Promise<Project | null> => {
    const platformProjects = await projectMemberService.listByUserId(userId)

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


async function getProjectAndTokenOrThrow(user: User): Promise<{ project: Project, token: string }> {
    const project = await getProjectForUserOrThrow(user.id)
    return {
        project,
        token: await populateTokenWithPlatformInfo({ user, project }),
    }
}

export const authenticationHelper = {
    getProjectAndTokenOrThrow,
}
