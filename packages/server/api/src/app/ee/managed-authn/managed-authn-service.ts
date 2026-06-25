import { createHash } from 'crypto'
import { isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { AuthenticationResponse, PiecesFilterType, PlatformRole, PrincipalType, Project, ProjectType, User, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { pieceRepos } from '../../pieces/metadata/piece-metadata-service'
import { pieceTagService } from '../../pieces/tags/pieces/piece-tag.service'
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
    // New SDK field: assign by externalId directly
    if (!isNil(pieceSetExternalId)) {
        const set = await pieceSetRepo().findOneBy({ platformId, externalId: pieceSetExternalId })
        if (isNil(set)) {
            log.warn({ platform: { id: platformId }, project: { id: projectId } }, `[managedAuthn] pieceSet externalId "${pieceSetExternalId}" not found — falling back to default`)
            const defaultSet = await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
            await pieceSetService(log).assignProject({ pieceSetId: defaultSet.id, platformId, projectId })
        }
        else {
            await pieceSetService(log).assignProject({ pieceSetId: set.id, platformId, projectId })
        }
        return
    }

    // Legacy compat: piecesTags → upsert a dedicated managed set for this project
    if (piecesFilterType === PiecesFilterType.ALLOWED && piecesTags.length > 0) {
        await upsertTagManagedSet({ platformId, projectId, piecesTags, log })
        return
    }

    // No restriction (NONE / empty tags) → assign to the platform default set
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

type UpsertTagManagedSetParams = {
    platformId: string
    projectId: string
    piecesTags: string[]
    log: FastifyBaseLogger
}

// Creates or updates a "managed" piece set generated for this project from the legacy piecesTags field.
// Uses generatedForProjectId as the idempotency key so repeated calls converge on the same set.
const upsertTagManagedSet = async ({ platformId, projectId, piecesTags, log }: UpsertTagManagedSetParams): Promise<void> => {
    const [taggedPieces, allPieceNames] = await Promise.all([
        pieceTagService.findByPlatformAndTags(platformId, piecesTags),
        fetchAllPieceNamesForPlatform(platformId),
    ])

    const taggedSet = new Set(taggedPieces)
    const disabledPieces = allPieceNames.filter((name) => !taggedSet.has(name))
    const config = { disabledPieces, disabledActions: {}, disabledTriggers: {} }

    const existing = await pieceSetRepo().findOneBy({ platformId, generatedForProjectId: projectId })
    if (!isNil(existing)) {
        await pieceSetRepo().update({ id: existing.id }, { config })
        await pieceSetService(log).assignProject({ pieceSetId: existing.id, platformId, projectId })
    }
    else {
        const created = await pieceSetService(log).create({
            platformId,
            name: `Managed (${projectId})`,
            externalId: undefined,
            isDefault: false,
            includeNewPieces: false,
            includeNewActions: false,
            generatedForProjectId: projectId,
            config,
        })
        await pieceSetService(log).assignProject({ pieceSetId: created.id, platformId, projectId })
    }
}

async function fetchAllPieceNamesForPlatform(platformId: string): Promise<string[]> {
    const rows: Array<{ name: string }> = await pieceRepos().manager.query(
        'SELECT DISTINCT name FROM piece_metadata WHERE "platformId" = $1 OR "platformId" IS NULL ORDER BY name ASC',
        [platformId],
    )
    return rows.map((r) => r.name)
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
