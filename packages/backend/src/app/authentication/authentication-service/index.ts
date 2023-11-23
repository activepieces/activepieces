import { QueryFailedError } from 'typeorm'
import { AuthenticationResponse, SignInRequest, UserStatus, ActivepiecesError, ErrorCode, isNil, User } from '@activepieces/shared'
import { userService } from '../../user/user-service'
import { passwordHasher } from '../lib/password-hasher'
import { authenticationServiceHooks as hooks } from './hooks'
import { generateRandomPassword } from '../../helper/crypto'

export const authenticationService = {
    async signUp(request: { email: string, password: string, firstName: string, lastName: string, trackEvents: boolean, newsLetter: boolean, status: UserStatus }): Promise<AuthenticationResponse> {
        try {
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

    async signIn(request: SignInRequest): Promise<AuthenticationResponse> {
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

    async federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
        const existingUser = await userService.getByPlatformAndEmail({
            platformId: params.platformId,
            email: params.email,
        })

        if (existingUser) {
            const { user: updatedUser, project, token } = await hooks.get().postSignIn({
                user: existingUser,
            })

            const userWithoutPassword = removePasswordPropFromUser(updatedUser)

            return {
                ...userWithoutPassword,
                token,
                projectId: project.id,
            }
        }

        const newUser = {
            email: params.email,
            status: params.userStatus,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: true,
            newsLetter: true,
            password: await generateRandomPassword(),
            platformId: params. platformId,
        }

        return this.signUp(newUser)
    },
}

const assertUserIsAllowedToSignIn: (user: User | null) => asserts user is User = (user) => {
    if (isNil(user) || user.status === UserStatus.INVITED) {
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

type FederatedAuthnParams = {
    email: string
    userStatus: UserStatus
    firstName: string
    lastName: string
    platformId: string | null
}
