import { createHash } from 'crypto'
import { isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { AuthenticationResponse, PiecesFilterType, PlatformRole, PrincipalType, Project, ProjectType, User, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { pieceSetRepo, pieceSetService } from '../pieces/piece-set/piece-set.service'
import { concurrencyPoolService } from '../platform/concurrency-pool/concurrency-pool.service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { externalTokenExtractor } from './lib/external-token-extractor'

export const managedAuthnService = (log: FastifyBaseLogger) => ({
    async externalToken({
        externalAccessToken,
    }: AuthenticateParams): Promise<AuthenticationResponse> {
        const externalPrincipal = await externalTokenExtractor(log).extract(
            externalAccessToken,
        )

        const { project } = await getOrCreateProject({
            platformId: externalPrincipal.platformId,
            externalProjectId: externalPrincipal.externalProjectId,
        }, log)

        if (!isNil(externalPrincipal.projectDisplayName)) {
            await projectService(log).update(project.id, {
                type: project.type,
                displayName: externalPrincipal.projectDisplayName,
            })
        }

        if (!isNil(externalPrincipal.concurrencyPoolKey) && !isNil(externalPrincipal.concurrencyPoolLimit)) {
            const { poolId } = await concurrencyPoolService(log).upsertPool({
                platformId: externalPrincipal.platformId,
                key: externalPrincipal.concurrencyPoolKey,
                maxConcurrentJobs: externalPrincipal.concurrencyPoolLimit,
            })
            await projectService(log).update(project.id, { type: project.type, poolId })
            await concurrencyPoolService(log).assignProject({ projectId: project.id, poolId })
        }

        await assignProjectPieceSet({
            platformId: project.platformId,
            projectId: project.id,
            pieceSetExternalId: externalPrincipal.pieceSetExternalId,
            piecesTags: externalPrincipal.pieces.tags,
            piecesFilterType: externalPrincipal.pieces.filterType,
            log,
        })

        const user = await getOrCreateUser(externalPrincipal, log)

        await projectMemberService(log).upsert({
            projectId: project.id,
            userId: user.id,
            projectRoleName: externalPrincipal.projectRole,
        })

        const identity = await userIdentityService(log).getOneOrFail({
            id: user.identityId,
        })

        const token = await accessTokenManager(log).generateToken({
            id: user.id,
            type: PrincipalType.USER,
            platform: {
                id: externalPrincipal.platformId,
            },
            tokenVersion: identity.tokenVersion,
        }, 7 * 24 * 60 * 60)
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

type AssignProjectPieceSetParams = {
    platformId: string
    projectId: string
    pieceSetExternalId: string | undefined
    piecesTags: string[]
    piecesFilterType: PiecesFilterType
    log: FastifyBaseLogger
}

const assignProjectPieceSet = async ({ platformId, projectId, pieceSetExternalId, piecesTags, piecesFilterType, log }: AssignProjectPieceSetParams): Promise<void> => {
    // Resolve which named set to assign: the explicit SDK externalId, or (legacy) the first
    // pieces tag. Multi-tag is unused, so only the first tag is honored; each tag maps to a
    // named set (externalId = tagName) created by the backfill migration.
    const targetExternalId = pieceSetExternalId
        ?? (piecesFilterType === PiecesFilterType.ALLOWED ? piecesTags[0] : undefined)

    const set = isNil(targetExternalId)
        ? null
        : await pieceSetRepo().findOneBy({ platformId, externalId: targetExternalId })

    if (!isNil(set)) {
        await pieceSetService(log).assignProject({ pieceSetId: set.id, platformId, projectId })
        return
    }

    if (!isNil(targetExternalId)) {
        log.warn({ platform: { id: platformId }, project: { id: projectId } }, `[managedAuthn] pieceSet externalId "${targetExternalId}" not found — falling back to default`)
    }
    const defaultSet = await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
    await pieceSetService(log).assignProject({ pieceSetId: defaultSet.id, platformId, projectId })
}

const getOrCreateUser = async (
    params: GetOrCreateUserParams,
    log: FastifyBaseLogger,
): Promise<User> => {
    const existingUser = await userService(log).getByPlatformAndExternalId({
        platformId: params.platformId,
        externalId: params.externalUserId,
    })

    if (!isNil(existingUser)) {
        return existingUser
    }
    const identity = await getOrCreateUserIdentity(params, log)
    const user = await userService(log).create({
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
}: GetOrCreateProjectParams, log: FastifyBaseLogger): Promise<{ project: Project, isNewProject: boolean }> => {
    const existingProject = await projectService(log).getByPlatformIdAndExternalId({
        platformId,
        externalId: externalProjectId,
    })

    if (!isNil(existingProject)) {
        return { project: existingProject, isNewProject: false }
    }

    const platform = await platformService(log).getOneOrThrow(platformId)

    const project = await projectService(log).create({
        displayName: externalProjectId,
        ownerId: platform.ownerId,
        platformId,
        externalId: externalProjectId,
        type: ProjectType.TEAM,
    })

    return { project, isNewProject: true }
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
