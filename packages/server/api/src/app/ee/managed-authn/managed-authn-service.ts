import { createHash } from 'crypto'
import {
    DEFAULT_PLATFORM_LIMIT,
} from '@activepieces/ee-shared'
import { cryptoUtils } from '@activepieces/server-shared'
import {
    AuthenticationResponse,
    isNil,
    PiecesFilterType,
    PlatformRole,
    PrincipalType,
    Project,
    User,
    UserIdentity,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { pieceTagService } from '../../tags/pieces/piece-tag.service'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { externalTokenExtractor } from './lib/external-token-extractor'

export const managedAuthnService = (log: FastifyBaseLogger) => ({
    async externalToken({
        externalAccessToken,
    }: AuthenticateParams): Promise<AuthenticationResponse> {
        const externalPrincipal = await externalTokenExtractor(log).extract(
            externalAccessToken,
        )

        const project = await getOrCreateProject({
            platformId: externalPrincipal.platformId,
            externalProjectId: externalPrincipal.externalProjectId,
        })

        await updateProjectLimits(project.platformId, project.id, externalPrincipal.pieces.tags, externalPrincipal.pieces.filterType, externalPrincipal.tasks, externalPrincipal.aiTokens)

        const user = await getOrCreateUser(externalPrincipal, log)

        await projectMemberService(log).upsert({
            projectId: project.id,
            userId: user.id,
            projectRoleName: externalPrincipal.projectRole,
        })

        const identity = await userIdentityService(log).getOneOrFail({
            id: user.identityId,
        })

        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
            platform: {
                id: externalPrincipal.platformId,
            },
            tokenVersion: identity.tokenVersion,
        }, 7 * 24 * 60 * 60 * 1000)
        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            platformId: user.platformId,
            firstName: identity.firstName,
            lastName: identity.lastName,
            email: identity.email,
            trackEvents: identity.trackEvents,
            newsLetter: identity.newsLetter,
            verified: identity.verified,
            token,
            projectId: project.id,
        }
    },
})

const updateProjectLimits = async (
    platformId: string,
    projectId: string,
    piecesTags: string[],
    piecesFilterType: PiecesFilterType,
    tasks: number | undefined,
    aiTokens: number | undefined,
): Promise<void> => {
    const pieces = await getPiecesList({
        platformId,
        projectId,
        piecesTags,
        piecesFilterType,
    })
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    await projectLimitsService.upsert({
        nickname: projectPlan?.name ?? DEFAULT_PLATFORM_LIMIT.nickname,
        tasks: tasks ?? projectPlan?.tasks ?? DEFAULT_PLATFORM_LIMIT.tasks,
        aiTokens: aiTokens ?? projectPlan?.aiTokens ?? DEFAULT_PLATFORM_LIMIT.aiTokens,
        pieces,
        piecesFilterType,
    }, projectId)
}

const getOrCreateUser = async (
    params: GetOrCreateUserParams,
    log: FastifyBaseLogger,
): Promise<User> => {
    const existingUser = await userService.getByPlatformAndExternalId({
        platformId: params.platformId,
        externalId: params.externalUserId,
    })

    if (!isNil(existingUser)) {
        return existingUser
    }
    const identity = await getOrCreateUserIdentity(params, log)
    const user = await userService.create({
        externalId: params.externalUserId,
        platformId: params.platformId,
        identityId: identity.id,
        platformRole: PlatformRole.MEMBER,
    })
    return user
}

const getOrCreateUserIdentity = async (
    params: GetOrCreateUserParams,
    log: FastifyBaseLogger,
): Promise<UserIdentity> => {
    const cleanedEmail = generateEmailHash(params)
    const existingIdentity = await userIdentityService(log).getIdentityByEmail(cleanedEmail)
    if (!isNil(existingIdentity)) {
        return existingIdentity
    }
    const identity = await userIdentityService(log).create({
        email: cleanedEmail,
        password: await cryptoUtils.generateRandomPassword(),
        firstName: params.externalFirstName,
        lastName: params.externalLastName,
        trackEvents: true,
        newsLetter: false,
        provider: UserIdentityProvider.JWT,
        verified: true,
    })
    return identity
}
const getOrCreateProject = async ({
    platformId,
    externalProjectId,
}: GetOrCreateProjectParams): Promise<Project> => {
    const existingProject = await projectService.getByPlatformIdAndExternalId({
        platformId,
        externalId: externalProjectId,
    })

    if (existingProject) {
        return existingProject
    }

    const platform = await platformService.getOneOrThrow(platformId)

    const project = await projectService.create({
        displayName: externalProjectId,
        ownerId: platform.ownerId,
        platformId,
        externalId: externalProjectId,
    })

    return project
}

const getPiecesList = async ({
    piecesFilterType,
    piecesTags,
    platformId,
}: UpdateProjectLimits): Promise<string[]> => {
    switch (piecesFilterType) {
        case PiecesFilterType.ALLOWED: {
            return pieceTagService.findByPlatformAndTags(
                platformId,
                piecesTags,
            )
        }
        case PiecesFilterType.NONE: {
            return []
        }
    }
}

function generateEmailHash(params: { platformId: string, externalUserId: string }): string {
    const inputString = `managed_${params.platformId}_${params.externalUserId}`
    return cleanEmailOtherwiseCompareFails(createHash('sha256').update(inputString).digest('hex'))
}

function cleanEmailOtherwiseCompareFails(email: string): string {
    return email.trim().toLowerCase()
}

type AuthenticateParams = {
    externalAccessToken: string
}

type GetOrCreateUserParams = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalFirstName: string
    externalLastName: string
}

type GetOrCreateProjectParams = {
    platformId: string
    externalProjectId: string
}

type UpdateProjectLimits = {
    platformId: string
    projectId: string
    piecesTags: string[]
    piecesFilterType: PiecesFilterType
}
