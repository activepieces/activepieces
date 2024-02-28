import { ApFlagId, PlatformRole, PrincipalType, Project, ProjectMemberRole, User } from '@activepieces/shared'
import { projectService } from '../../../project/project-service'
import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { accessTokenManager } from '../../lib/access-token-manager'
import { flagService } from '../../../flags/flag.service'
import { userService } from '../../../user/user-service'
import { platformService } from '../../../platform/platform.service'

const DEFAULT_PLATFORM_NAME = 'platform'

export const communityAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn() {
        // Empty
    },
    async preSignUp() {
        // Empty
    },
    async postSignUp({ user }) {
        const platformCreated = await flagService.getOne(ApFlagId.PLATFORM_CREATED)
        if (platformCreated?.value) {
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
        await userService.updatePlatformId({ id: user.id, platformId: platform.id })

        await flagService.save({
            id: ApFlagId.PLATFORM_CREATED,
            value: true,
        })
        return getProjectAndToken(user)
    },

    async postSignIn({ user }) {
        return getProjectAndToken(user)
    },
}

async function getProjectAndToken(user: User): Promise<{ user: User, project: Project, token: string, projectRole: ProjectMemberRole }> {
    const updatedUser = await userService.getOneOrFail({ id: user.id })
    
    const project = await projectService.getUserProjectOrThrow(user.id)
    const platform = await platformService.getOneOrThrow(project.platformId)
    const token = await accessTokenManager.generateToken({
        id: user.id,
        type: PrincipalType.USER,
        projectId: project.id,
        platform: {
            id: platform.id,
            role: platform.ownerId === user.id ? PlatformRole.OWNER : PlatformRole.MEMBER,
        },
    })
    return {
        user: updatedUser,
        token,
        project,
        projectRole: ProjectMemberRole.ADMIN,
    }
}
