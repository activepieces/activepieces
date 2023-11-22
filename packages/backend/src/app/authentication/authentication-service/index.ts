import { QueryFailedError } from 'typeorm'
import { AuthenticationResponse, SignInRequest, UserStatus, ActivepiecesError, ErrorCode, isNil, User } from '@activepieces/shared'
import { userService } from '../../user/user-service'
import { passwordHasher } from '../lib/password-hasher'
import { authenticationServiceHooks as hooks } from './hooks'

export const authenticationService = {
    signUp: async (request: { email: string, password: string, firstName: string, lastName: string, trackEvents: boolean, newsLetter: boolean, status: UserStatus }): Promise<AuthenticationResponse> => {
        try {
      
            const userWithSameEmail = await userService.getbyEmail({ email: request.email })
            if (userWithSameEmail) {
                throw new ActivepiecesError({
                    code: ErrorCode.EXISTING_USER,
                    params: {
                        email: request.email,
                    },
                    
                })
            }
            const user = await userService.create({
                ...request,
                platformId: null,
            })

            const { user: updatedUser, project, token } = await hooks.get().postSignUp({
                user,
            })

            const userWithoutPassword = removePasswordPropFromUser(updatedUser)

            return {
                ...userWithoutPassword,
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
        const user = await userService.getByPlatformAndEmail({
            platformId: null,
            email: request.email,
        })

        assertUserIsAllowedToSignIn(user)

        await assertPasswordMatches({
            requestPassword: request.password,
            userPassword: user.password,
        })

        const { user: updatedUser, project, token } = await hooks.get().postSignIn({
            user,
        })

        const userWithoutPassword = removePasswordPropFromUser(updatedUser)

        return {
            ...userWithoutPassword,
            token,
            projectId: project.id,
        }
    },
}

const assertUserIsAllowedToSignIn: (user: User | null) => asserts user is User = (user) => {
    if (isNil(user) || user.status === UserStatus.CREATED ||   user.status === UserStatus.VERIFIED) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: {
                email: user?.email,
            },
        })
    }
}

const assertPasswordMatches = async ({ requestPassword, userPassword }: AssertPasswordsMatchParams): Promise<void> => {
    const passwordMatches = await passwordHasher.compare(requestPassword, userPassword)

    if (!passwordMatches) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: {},
        })
    }
}

const removePasswordPropFromUser = (user: User): Omit<User, 'password'> => {
    const { password: _, ...filteredUser } = user
    return filteredUser
}

type AssertPasswordsMatchParams = {
    requestPassword: string
    userPassword: string
}
