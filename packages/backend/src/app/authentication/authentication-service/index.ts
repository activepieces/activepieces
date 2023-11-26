import { QueryFailedError } from 'typeorm'
import { AuthenticationResponse, UserStatus, ActivepiecesError, ErrorCode, isNil, User, ApFlagId } from '@activepieces/shared'
import { userService } from '../../user/user-service'
import { passwordHasher } from '../lib/password-hasher'
import { authenticationServiceHooks as hooks } from './hooks'
import { generateRandomPassword } from '../../helper/crypto'
import { flagService } from '../../flags/flag.service'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

export const authenticationService = {
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
        await assertSignUpIsEnabled()

        const user = await createUser(params)

        const authnResponse = await hooks.get().postSignUp({
            user,
            referringUserId: params.referringUserId,
        })

        const userWithoutPassword = removePasswordPropFromUser(authnResponse.user)

        return {
            ...userWithoutPassword,
            token: authnResponse.token,
            projectId: authnResponse.project.id,
        }
    },

    async signIn(request: SignInParams): Promise<AuthenticationResponse> {
        const user = await userService.getByPlatformAndEmail({
            platformId: request.platformId,
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

const assertSignUpIsEnabled = async (): Promise<void> => {
    const userCreated = await flagService.getOne(ApFlagId.USER_CREATED)
    const signUpEnabled = system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false

    if (userCreated && !signUpEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.SIGN_UP_DISABLED,
            params: {},
        })
    }
}

const createUser = async (params: SignUpParams): Promise<User> => {
    try {
        const newUser: NewUser = {
            email: params.email,
            status: params.status,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: params.trackEvents,
            newsLetter: params.newsLetter,
            password: params.password,
            platformId: params.platformId,
        }

        return userService.create(newUser)
    }
    catch (e: unknown) {
        if (e instanceof QueryFailedError) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email: params.email,
                    platformId: params.platformId,
                },
            })
        }

        throw e
    }
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

type NewUser = Omit<User, 'id' | 'created' | 'updated'>

type SignUpParams = {
    email: string
    password: string
    firstName: string
    lastName: string
    trackEvents: boolean
    newsLetter: boolean
    status: UserStatus
    platformId: string | null
    referringUserId?: string
}

type SignInParams = {
    email: string
    password: string
    platformId: string | null
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
