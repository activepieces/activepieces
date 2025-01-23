import {
    apId,
    assertNotNullOrUndefined,
    isNil,
    Platform,
    PlatformRole,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../../platform/platform.service'
import { projectRepo } from '../../project/project-service'
import { system } from '../../helper/system/system'
import { userRepo, userService } from '../../user/user-service'
import { AppConnectionEntity } from '../../app-connection/app-connection.entity'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { FlowTemplateEntity } from '../flow-template/flow-template.entity'
import { FileEntity } from '../../file/file.entity'
import { UserInvitationEntity } from '../../user-invitations/user-invitation.entity'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { PieceMetadataEntity } from '../../pieces/piece-metadata-entity'
import { UserIdentityEntity } from '../../authentication/user-identity/user-identity-entity'
import { ProjectBillingEntity } from '../billing/project-billing/project-billing.entity'
import { ProjectPlanEntity } from '../project-plan/project-plan.entity'
import { platformProjectService } from '../projects/platform-project-service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { platformBillingService } from '../platform-billing/platform-billing.service'
import { PlatformBillingEntity } from '../platform-billing/platform-billing.entity'
import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { stripeHelper, TASKS_PAYG_PRICE_ID } from '../platform-billing/stripe-helper'
import { apDayjs } from '../../helper/dayjs-helper'
import { AppSystemProp } from '@activepieces/server-shared'
import { Not } from 'typeorm'

export const appConnectionRepo = repoFactory(AppConnectionEntity)
export const flowTemplateRepo = repoFactory(FlowTemplateEntity)
export const fileRepo = repoFactory(FileEntity)
export const userInvitationRepo = repoFactory(UserInvitationEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)
export const pieceMetadataRepo = repoFactory(PieceMetadataEntity)
export const userIdentityRepo = repoFactory(UserIdentityEntity)
export const projectBillingRepo = repoFactory(ProjectBillingEntity)
export const projectPlanRepo = repoFactory(ProjectPlanEntity)
export const platformBillingRepo = repoFactory(PlatformBillingEntity)

export const adminPlatformService = (log: FastifyBaseLogger) => ({
    async add(userId: UserId) {
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        const userMeta = await userService.getMetaInformation({ id: userId })
        const userIdentity = await userIdentityRepo().findOneByOrFail({ email: userMeta.email })
        const allUsers = await userRepo().find({ where: { identityId: userIdentity.id, platformId: Not(cloudPlatformId) } })
        if (allUsers.length > 0) {
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
            where: [
                { userId: userId },
                { projectId: project.id },
            ],
        })
        let usersCreated = 0
        for (const projectMember of projectMembers) {
            const userId = projectMember.userId
            const userMember = await userRepo().findOneByOrFail({
                id: userId,
            })
            const project = await projectRepo().findOneByOrFail({
                id: projectMember.projectId,
            })
            if (userMember.platformId !== project.platformId) {

                const projectPlatformId = project.platformId
                const existingUser = await userRepo().findOneBy({
                    identityId: userMember.identityId,
                    platformId: projectPlatformId,
                })
                if (!isNil(existingUser)) {
                    await projectMemberRepo().update({
                        id: projectMember.id,
                    }, {
                        platformId: projectPlatformId,
                        userId: existingUser.id,
                    })
                } else {
                    const newUser = await userService.create({
                        identityId: userMember.identityId,
                        platformId: projectPlatformId,
                        platformRole: PlatformRole.MEMBER,
                    })
                    usersCreated++
                    await projectMemberRepo().update({
                        id: projectMember.id,
                    }, {
                        userId: newUser.id,
                        platformId: projectPlatformId,
                    })
                }
            }
        }
        if (projectMembers.length > 0) {
            await platformService.update({
                id: platform.id,
                projectRolesEnabled: true,
            })
        }

        await pieceMetadataRepo().update({
            projectId: project.id,
        }, {
            platformId: platform.id,
        })

        const user = await userRepo().findOneByOrFail({
            id: userId,
        })
        await userIdentityRepo().update({
            id: user.identityId,
        }, {
            tokenVersion: apId()
        })

        const projectBilling = await projectBillingService(system.globalLogger()).getOrCreateForProject(project.id)
        const projectPlan = await platformProjectService(system.globalLogger()).getWithPlanAndUsageOrThrow(project.id)

        const platformPlan = await platformBillingService(system.globalLogger()).getOrCreateForPlatform(platform.id)

        await platformBillingRepo().update(platformPlan.id, {
            tasksLimit: projectPlan.plan.tasks ?? undefined,
            aiCreditsLimit: projectPlan.plan.aiTokens ?? undefined,
            includedAiCredits: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
            includedTasks: projectBilling.includedTasks,
        })

        const stripeSubscriptionId = projectBilling.stripeSubscriptionId
        if (!isNil(stripeSubscriptionId) && projectBilling.subscriptionStatus === ApSubscriptionStatus.ACTIVE && !isNil(projectBilling.stripeCustomerId)) {
            const stripe = stripeHelper(system.globalLogger()).getStripe()
            assertNotNullOrUndefined(stripe, 'stripe')

            await stripe.subscriptions.cancel(stripeSubscriptionId);

            const newSubscription = await stripe?.subscriptions.create({
                items: [{
                    price: TASKS_PAYG_PRICE_ID,
                }],
                billing_cycle_anchor: apDayjs().startOf('month').add(1, 'month').unix(),
                customer: projectBilling.stripeCustomerId,
            });

            await platformBillingRepo().update(platformPlan.id, {
                stripeSubscriptionId: newSubscription.id,
                stripeSubscriptionStatus: ApSubscriptionStatus.ACTIVE,
                stripeCustomerId: projectBilling.stripeCustomerId,
            })
        }

        const migratedProjectMembers = await projectMemberRepo().find({
            where: { projectId: project.id }
        });

        for (const member of migratedProjectMembers) {
            const memberUser = await userRepo().findOneByOrFail({ id: member.userId });
            if (memberUser.platformId !== platform.id) {
                throw new Error(`User with ID ${member.userId} is not in the same platform`);
            }
        }
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

        return {
            platform,
            projectMembers: projectMembers.length,
            usersCreated,
        }
    },
})
