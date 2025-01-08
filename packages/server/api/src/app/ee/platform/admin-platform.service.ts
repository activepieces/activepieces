import {
    isNil,
    Platform,
    PlatformRole,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../../platform/platform.service'
import { projectRepo } from '../../project/project-service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-prop'
import { userRepo, userService } from '../../user/user-service'
import { AppConnectionEntity } from '../../app-connection/app-connection.entity'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { FlowTemplateEntity } from '../flow-template/flow-template.entity'
import { FileEntity } from '../../file/file.entity'
import { UserInvitationEntity } from '../../user-invitations/user-invitation.entity'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { PieceMetadataEntity } from '../../pieces/piece-metadata-entity'

export const appConnectionRepo = repoFactory(AppConnectionEntity)
export const flowTemplateRepo = repoFactory(FlowTemplateEntity)
export const fileRepo = repoFactory(FileEntity)
export const userInvitationRepo = repoFactory(UserInvitationEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)
export const pieceMetadataRepo = repoFactory(PieceMetadataEntity)

export const adminPlatformService = (log: FastifyBaseLogger) => ({
    async add(userId: UserId): Promise<Platform> {
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        const userMeta = await userService.getMetaInformation({ id: userId })

        if (userMeta.platformId !== cloudPlatformId) {
            throw new Error("User is already migrated")
        }
        const project = await projectRepo().findOneByOrFail({
            ownerId: userId,
            platformId: cloudPlatformId,
        })

        const platform = await platformService.create({
            ownerId: userId,
            name: `${userMeta.firstName}'s Platform`,
        })
        await userRepo().update({
            id: userId,
        }, {
            platformId: platform.id,
            platformRole: PlatformRole.ADMIN,
        })
        await projectRepo().update({
            id: project.id,
        }, {
            platformId: platform.id,
        })

        await appConnectionRepo().update({
            projectIds: APArrayContains('projectIds', [project.id])
        }, {
            platformId: platform.id,
        })

        await flowTemplateRepo().update({
            projectId: project.id,
        }, {
            platformId: platform.id,
        })

        await fileRepo().update({
            projectId: project.id,
        }, {
            platformId: platform.id,
        })

        await userInvitationRepo().update({
            projectId: project.id,
        }, {
            platformId: platform.id,
        })

        const projectMembers = await projectMemberRepo().find({
            where: {
                projectId: project.id,
            },
        })
        for (const projectMember of projectMembers) {
            const userId = projectMember.userId
            const userMember = await userRepo().findOneByOrFail({
                id: userId,
            })
            if (userMember.platformId !== platform.id) {

                const existingUser = await userRepo().findOneBy({
                    identityId: userMember.identityId,
                    platformId: platform.id,
                })
                if (!isNil(existingUser)) {
                    await projectMemberRepo().update({
                        id: projectMember.id,
                    }, {
                        platformId: platform.id,
                        userId: existingUser.id,
                    })
                } else {
                    const newUser = await userService.create({
                        identityId: userMember.identityId,
                        platformId: platform.id,
                        platformRole: PlatformRole.MEMBER,
                    })
                    await projectMemberRepo().update({
                        id: projectMember.id,
                    }, {
                        userId: newUser.id,
                        platformId: platform.id,
                    })
                }
            }
        }

        await pieceMetadataRepo().update({
            projectId: project.id,
        }, {
            platformId: platform.id,
        })

        // Check if all updates were successful
        const updatedUser = await userRepo().findOneByOrFail({ id: userId })
        if (updatedUser.platformId !== platform.id || updatedUser.platformRole !== PlatformRole.ADMIN) {
            throw new Error("Failed to update user platform information")
        }

        const updatedProject = await projectRepo().findOneByOrFail({ id: project.id })
        if (updatedProject.platformId !== platform.id) {
            throw new Error("Failed to update project platform information")
        }

        const updatedAppConnections = await appConnectionRepo().find({
            where: { projectIds: APArrayContains('projectIds', [project.id]) }
        })
        if (updatedAppConnections.some(conn => conn.platformId !== platform.id)) {
            throw new Error("Failed to update app connections platform information")
        }

        const updatedFlowTemplates = await flowTemplateRepo().find({
            where: { projectId: project.id }
        })
        if (updatedFlowTemplates.some(template => template.platformId !== platform.id)) {
            throw new Error("Failed to update flow templates platform information")
        }

        const updatedFiles = await fileRepo().find({
            where: { projectId: project.id }
        })
        if (updatedFiles.some(file => file.platformId !== platform.id)) {
            throw new Error("Failed to update files platform information")
        }

        const updatedUserInvitations = await userInvitationRepo().find({
            where: { projectId: project.id }
        })
        if (updatedUserInvitations.some(invitation => invitation.platformId !== platform.id)) {
            throw new Error("Failed to update user invitations platform information")
        }

        const updatedPieceMetadata = await pieceMetadataRepo().find({
            where: { projectId: project.id }
        })
        if (updatedPieceMetadata.some(metadata => metadata.platformId !== platform.id)) {
            throw new Error("Failed to update piece metadata platform information")
        }

        return platform
    },
})
