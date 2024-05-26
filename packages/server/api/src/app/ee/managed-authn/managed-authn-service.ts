import { randomBytes as randomBytesCallback } from 'node:crypto'
import { promisify } from 'node:util'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { pieceTagService } from '../../tags/pieces/piece-tag.service'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { externalTokenExtractor } from './lib/external-token-extractor'
import {
    DEFAULT_PLATFORM_LIMIT,
    ProjectMemberStatus,
} from '@activepieces/ee-shared'
import {
    AuthenticationResponse,
    PiecesFilterType,
    PlatformRole,
    PrincipalType,
    Project,
    User,
} from '@activepieces/shared'

export const managedAuthnService = {
    async externalToken({
        externalAccessToken,
    }: AuthenticateParams): Promise<AuthenticationResponse> {
        const externalPrincipal = await externalTokenExtractor.extract(
            externalAccessToken,
        )
        const user = await getOrCreateUser(externalPrincipal)

        const project = await getOrCreateProject({
            platformId: externalPrincipal.platformId,
            externalProjectId: externalPrincipal.externalProjectId,
        })

        await updateProjectLimits(project.platformId, project.id, externalPrincipal.pieces.tags, externalPrincipal.pieces.filterType)

        const projectMember = await projectMemberService.upsert({
            projectId: project.id,
            email: externalPrincipal.externalEmail,
            role: externalPrincipal.role,
            status: ProjectMemberStatus.ACTIVE,
        })


        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
            platform: {
                id: externalPrincipal.platformId,
            },
        })
        return {
            ...user,
            token,
            projectId: project.id,
            projectRole: projectMember.role,
        }
    },
}

const updateProjectLimits = async (
    platformId: string,
    projectId: string,
    piecesTags: string[],
    piecesFilterType: PiecesFilterType,
): Promise<void> => {
    const pieces = await getPiecesList({
        platformId,
        projectId,
        piecesTags,
        piecesFilterType,
    })
    await projectLimitsService.upsert({
        ...DEFAULT_PLATFORM_LIMIT,
        pieces,
        piecesFilterType,
    }, projectId)
}

const getOrCreateUser = async (
    params: GetOrCreateUserParams,
): Promise<GetOrCreateUserReturn> => {
    const {
        platformId,
        externalUserId,
        externalEmail,
        externalFirstName,
        externalLastName,
    } = params
    const existingUser = await userService.getByPlatformAndExternalId({
        platformId,
        externalId: externalUserId,
    })

    if (existingUser) {
        const { password: _, ...user } = existingUser
        return user
    }

    const { password: _, ...newUser } = await userService.create({
        email: externalEmail,
        password: await generateRandomPassword(),
        firstName: externalFirstName,
        lastName: externalLastName,
        trackEvents: true,
        newsLetter: false,
        platformRole: PlatformRole.MEMBER,
        verified: true,
        externalId: externalUserId,
        platformId,
    })
    return newUser
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

const randomBytes = promisify(randomBytesCallback)

const generateRandomPassword = async (): Promise<string> => {
    const passwordBytes = await randomBytes(32)
    return passwordBytes.toString('hex')
}

type AuthenticateParams = {
    externalAccessToken: string
}

type GetOrCreateUserParams = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalEmail: string
    externalFirstName: string
    externalLastName: string
}

type GetOrCreateUserReturn = Omit<User, 'password'>

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
