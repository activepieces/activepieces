import {
    cryptoUtils,
    logger,
    SharedSystemProp,
    system,
} from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEnvironment,
    ApFlagId,
    AuthenticationResponse,
    ErrorCode,
    isNil,
    PlatformRole,
    Project,
    TelemetryEventName,
    User,
    UserId,
    UserStatus,
} from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { QueryFailedError } from 'typeorm'
import { flagService } from '../../flags/flag.service'
import { telemetry } from '../../helper/telemetry.utils'
import { userService } from '../../user/user-service'
import { passwordHasher } from '../lib/password-hasher'
import { authenticationServiceHooks as hooks } from './hooks'
import { Provider } from './hooks/authentication-service-hooks'

export const authenticationService = {
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
        await hooks.get().preSignUp(params)
        const user = await createUser(params)

        return this.signUpResponse({
            user,
            referringUserId: params.referringUserId,
        })
    },

    async signIn(request: SignInParams): Promise<AuthenticationResponse> {
        await hooks.get().preSignIn(request)
        const user = await userService.getByPlatformAndEmail({
            platformId: request.platformId,
            email: request.email,
        })

        assertUserIsAllowedToSignIn(user)

        await assertPasswordMatches({
            requestPassword: request.password,
            userPassword: user.password,
        })

        return this.signInResponse({
            user,
        })
    },

    async federatedAuthn(
        params: FederatedAuthnParams,
    ): Promise<AuthenticationResponse> {
        const existingUser = await userService.getByPlatformAndEmail({
            platformId: params.platformId,
            email: params.email,
        })
        if (existingUser) {
            return this.signInResponse({
                user: existingUser,
            })
        }
        const newUser = {
            email: params.email,
            verified: params.verified,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: true,
            newsLetter: true,
            password: await cryptoUtils.generateRandomPassword(),
            platformId: params.platformId,
        }

        return this.signUp({
            ...newUser,
            provider: Provider.FEDERATED,
        })
    },

    async signUpResponse({
        user,
        referringUserId,
    }: SignUpResponseParams): Promise<AuthenticationResponse> {
        const authnResponse = await hooks.get().postSignUp({
            user,
            referringUserId,
        })
        await flagService.save({ id: ApFlagId.USER_CREATED, value: true })

        const userWithoutPassword = removePasswordPropFromUser(authnResponse.user)

        await sendTelemetry({
            user,
            project: authnResponse.project,
        })
        await saveNewsLetterSubscriber(user)

        return {
            ...userWithoutPassword,
            token: authnResponse.token,
            projectId: authnResponse.project.id,
        }
    },

    async signInResponse({
        user,
    }: SignInResponseParams): Promise<AuthenticationResponse> {
        const authnResponse = await hooks.get().postSignIn({
            user,
        })

        const userWithoutPassword = removePasswordPropFromUser(authnResponse.user)

        return {
            ...userWithoutPassword,
            token: authnResponse.token,
            projectId: authnResponse.project.id,
        }
    },
}

const createUser = async (params: SignUpParams): Promise<User> => {
    try {
        const newUser: NewUser = {
            email: params.email,
            platformRole: PlatformRole.MEMBER,
            verified: params.verified,
            status: UserStatus.ACTIVE,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: params.trackEvents,
            newsLetter: params.newsLetter,
            password: params.password,
            platformId: params.platformId ?? null,
            tokenVersion: nanoid(),
        }

        return await userService.create(newUser)
    }
    catch (e: unknown) {
        if (e instanceof QueryFailedError) {
            logger.error(e)
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

const assertUserIsAllowedToSignIn: (
    user: User | null
) => asserts user is User = (user) => {
    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }
    if (user.status === UserStatus.INACTIVE) {
        throw new ActivepiecesError({
            code: ErrorCode.USER_IS_INACTIVE,
            params: {
                email: user.email,
            },
        })
    }
    if (!user.verified) {
        throw new ActivepiecesError({
            code: ErrorCode.EMAIL_IS_NOT_VERIFIED,
            params: {
                email: user.email,
            },
        })
    }
}

const assertPasswordMatches = async ({
    requestPassword,
    userPassword,
}: AssertPasswordsMatchParams): Promise<void> => {
    const passwordMatches = await passwordHasher.compare(
        requestPassword,
        userPassword,
    )

    if (!passwordMatches) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }
}

const removePasswordPropFromUser = (user: User): Omit<User, 'password'> => {
    const { password: _, ...filteredUser } = user
    return filteredUser
}

const sendTelemetry = async ({
    user,
    project,
}: SendTelemetryParams): Promise<void> => {
    try {
        await telemetry.identify(user, project.id)

        await telemetry.trackProject(project.id, {
            name: TelemetryEventName.SIGNED_UP,
            payload: {
                userId: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                projectId: project.id,
            },
        })
    }
    catch (e) {
        logger.warn({ name: 'AuthenticationService#sendTelemetry', error: e })
    }
}

async function saveNewsLetterSubscriber(user: User): Promise<void> {
    const isPlatformUserOrNotSubscribed =
    (!isNil(user.platformId) &&
      !flagService.isCloudPlatform(user.platformId)) ||
    !user.newsLetter
    const environment = system.get(SharedSystemProp.ENVIRONMENT)
    if (
        isPlatformUserOrNotSubscribed ||
    environment !== ApEnvironment.PRODUCTION
    ) {
        return
    }
    try {
        const response = await fetch(
            'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email }),
            },
        )
        return await response.json()
    }
    catch (error) {
        logger.warn(error)
    }
}
type SendTelemetryParams = {
    user: User
    project: Project
}

type NewUser = Omit<User, 'id' | 'created' | 'updated'> & {
    platformId: string | null
}

type SignUpParams = {
    email: string
    password: string
    firstName: string
    lastName: string
    trackEvents: boolean
    newsLetter: boolean
    verified: boolean
    platformId: string | null
    referringUserId?: string
    provider: Provider
}

type SignInParams = {
    email: string
    password: string
    platformId: string | null
    provider: Provider
}

type AssertPasswordsMatchParams = {
    requestPassword: string
    userPassword: string
}

type FederatedAuthnParams = {
    email: string
    verified: boolean
    firstName: string
    lastName: string
    platformId: string | null
}

type SignUpResponseParams = {
    user: User
    referringUserId?: UserId
}

type SignInResponseParams = {
    user: User
}