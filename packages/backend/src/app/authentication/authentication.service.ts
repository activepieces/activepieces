import { SignUpRequest, AuthenticationResponse, PrincipalType, SignInRequest, TelemetryEventName, ApFlagId, UserStatus } from '@activepieces/shared'
import { userService } from '../user/user-service'
import { passwordHasher } from './lib/password-hasher'
import { tokenUtils } from './lib/token-utils'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { projectService } from '../project/project.service'
import { flagService } from '../flags/flag.service'
import { QueryFailedError } from 'typeorm'
import { telemetry } from '../helper/telemetry.utils'

export const authenticationService = {
    signUp: async (request: SignUpRequest): Promise<AuthenticationResponse> => {
        try {
            const user = await userService.upsert(request)

            await flagService.save({ id: ApFlagId.USER_CREATED, value: true })

            const project = await projectService.create({
                displayName: 'Project',
                ownerId: user.id,
            })

            const token = await tokenUtils.encode({
                id: user.id,
                type: PrincipalType.USER,
                projectId: project.id,
            })

            telemetry.identify(user, project.id)
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
            user.password = undefined
            return {
                ...user,
                token,
                projectId: project.id,
            }
        }
        catch (e: unknown) {
            if (e instanceof QueryFailedError) {
                throw new ActivepiecesError({
                    code: ErrorCode.EXISTING_USER,
                    params: {
                        email: request.email,
                    },
                })
            }

            throw e
        }
    },

    signIn: async (request: SignInRequest): Promise<AuthenticationResponse> => {
        const user = await userService.getOneByEmail({
            email: request.email,
        })

        if (user === null || user.status !== UserStatus.VERIFIED) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS,
                params: {
                    email: request.email,
                },
            })
        }

        const passwordMatches = await passwordHasher.compare(request.password, user.password)

        if (!passwordMatches) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS,
                params: {
                    email: request.email,
                },
            })
        }

        // Currently each user have exactly one project.
        const projects = await projectService.getUserProject(user.id)

        const token = await tokenUtils.encode({
            id: user.id,
            type: PrincipalType.USER,
            projectId: projects[0].id,
        })

        user.password = undefined
        return {
            ...user,
            token,
            projectId: projects[0].id,
        }
    },
}
