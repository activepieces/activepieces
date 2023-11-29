import { ApFlagId, PrincipalType, Project, ProjectType, User } from '@activepieces/shared'
import { projectService } from '../../../project/project-service'
import { flagService } from '../../../flags/flag.service'
import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { accessTokenManager } from '../../lib/access-token-manager'

export const communityAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async postSignUp({ user }) {
        await flagService.save({ id: ApFlagId.USER_CREATED, value: true })
        const project = await projectService.create({
            displayName: `${user.firstName}'s Project`,
            ownerId: user.id,
            platformId: undefined,
            type: ProjectType.STANDALONE,
        })
        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
            projectType: project.type,
        })
        return {
            user,
            project,
            token,
        }
    },

    async postSignIn({ user }) {
        const project = await getProject(user)
        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
            projectType: project.type,
        })
        return {
            user,
            token,
            project,
        }
    },
}


const getProject = async (user: User): Promise<Project> => {
    return projectService.getUserProjectOrThrow(user.id)
}
