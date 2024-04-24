import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { accessTokenManager } from '../../lib/access-token-manager'
import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { PrincipalType, Project, ProjectMemberRole, User } from '@activepieces/shared'

const DEFAULT_PLATFORM_NAME = 'platform'

export const communityAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn() {
        // Empty
    },
    async preSignUp() {
        // Empty
    },
    async postSignUp({ user }) {
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
        },
    })
    return {
        user: updatedUser,
        token,
        project,
        projectRole: ProjectMemberRole.ADMIN,
    }
}
