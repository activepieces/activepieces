import { ApFlagId, PrincipalType, ProjectType, TelemetryEventName } from '@activepieces/shared'
import { projectService } from '../../../project/project-service'
import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { accessTokenManager } from '../../lib/access-token-manager'
import { telemetry } from '../../../helper/telemetry.utils'
import { logger } from '../../../helper/logger'
import { flagService } from '../../../flags/flag.service'

export const defaultAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async postSignUp({ user }) {
        await flagService.save({ id: ApFlagId.USER_CREATED, value: true })

        const project = await projectService.create({
            displayName: user.firstName + '\'s Project',
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

        telemetry.identify(user, project.id)
            .catch((e) => logger.error(e, '[AuthenticationService#signUp] telemetry.identify'))

        telemetry.trackProject(project.id, {
            name: TelemetryEventName.SIGNED_UP,
            payload: {
                userId: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                projectId: project.id,
            },
        })
            .catch((e) => logger.error(e, '[AuthenticationService#signUp] telemetry.trackProject'))

        return {
            user,
            project,
            token,
        }
    },

    async postSignIn({ user }) {
        const project = await projectService.getUserProject(user.id)

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
}
