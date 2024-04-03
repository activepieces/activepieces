import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { ReferralEntity } from './referral.entity'
import { DEFAULT_FREE_PLAN_LIMIT, Referral } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import {
    apId,
    Cursor,
    isNil,
    SeekPage,
    TelemetryEventName,
    UserId,
} from '@activepieces/shared'

const referralRepo = databaseConnection.getRepository(ReferralEntity)

export const referralService = {
    async add({ referringUserId, referredUserId, referredUserEmail }: AddParams): Promise<void> {
        const referringUser = await userService.getMetaInfo({ id: referringUserId })

        if (isNil(referringUser)) {
            logger.warn({ name: 'ReferralService#add', referringUserId, referredUserId }, 'Referring user not found')
            return
        }

        const newReferral: NewReferral = {
            id: apId(),
            referringUserId,
            referringUserEmail: referringUser.email,
            referredUserId,
            referredUserEmail,
        }

        await referralRepo.save(newReferral)

        telemetry
            .trackUser(referringUserId, {
                name: TelemetryEventName.REFERRAL,
                payload: {
                    referredUserId,
                },
            })
            .catch((e) =>
                logger.error(e, '[ReferralService#upsert] telemetry.trackUser'),
            )

        await addExtraTasks(referringUserId)
        await addExtraTasks(referredUserId)
    },
    async list(
        referringUserId: UserId,
        cursorRequest: Cursor | null,
        limit: number,
    ): Promise<SeekPage<Referral>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ReferralEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(
            referralRepo.createQueryBuilder().where({ referringUserId }),
        )
        return paginationHelper.createPage<Referral>(data, cursor)
    },
}

async function addExtraTasks(userId: string): Promise<void> {
    const referralsCount = await referralRepo.countBy({
        referringUserId: userId,
    })
    if (referralsCount > 5) {
        return
    }
    const ownerProject = await projectService.getUserProjectOrThrow(userId)
    const projectBilling = await projectBillingService.getOrCreateForProject(ownerProject.id)
    const newBilling = await projectBillingService.increaseTasks(projectBilling.projectId, 500)
    await projectLimitsService.getOrCreateDefaultPlan(ownerProject.id, DEFAULT_FREE_PLAN_LIMIT)
    await projectLimitsService.increaseTask(ownerProject.id, 500)

    logger.info({
        message: 'Added 500 tasks to project',
        projectId: ownerProject.id,
        includedTasks: newBilling.includedTasks,
    })
}

type AddParams = {
    referringUserId: UserId
    referredUserId: UserId
    referredUserEmail: string
}

type NewReferral = Omit<Referral, 'created' | 'updated'>
