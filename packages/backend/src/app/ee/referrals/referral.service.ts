import { Cursor, SeekPage, TelemetryEventName, UserId, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ReferralEntity } from './referral.entity'
import { Referral } from '@activepieces/shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { telemetry } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { logger } from '../../helper/logger'
import { plansService } from '../billing/project-plan/project-plan.service'

const referralRepo = databaseConnection.getRepository(ReferralEntity)

export const referralService = {
    async upsert({
        referredUserId,
        referringUserId,
    }: {
        referringUserId: string
        referredUserId: string
    }) {
        const referingUser = await userService.getMetaInfo({ id: referringUserId })
        if (!referingUser) {
            logger.warn(`Referring user ${referringUserId} not found, ignoring.`)
            return
        }
        await referralRepo.upsert(
            {
                referredUserId,
                referringUserId,
                id: apId(),
            },
            ['referredUserId', 'referringUserId'],
        )

        telemetry.trackUser(referringUserId, {
            name: TelemetryEventName.REFERRAL,
            payload: {
                referredUserId,
            },
        })
            .catch((e) => logger.error(e, '[ReferralService#upsert] telemetry.trackUser'))

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

async function addExtraTasks(userId: string) {
    const referralsCount = await referralRepo.countBy({ referringUserId: userId })
    if (referralsCount > 5) {
        return
    }
    const ownerProject = await projectService.getUserProjectOrThrow(userId)
    const projectPlan = await plansService.getOrCreateDefaultPlan({
        projectId: ownerProject.id,
    })
    const newTasks = projectPlan!.tasks + 500

    await plansService.removeDailyTasksAndUpdateTasks({
        projectId: ownerProject.id,
        tasks: newTasks,
    })
    logger.info(`Referral from ${userId}  created and plan for project ${ownerProject.id} updated to add ${newTasks} tasks.`)
}
