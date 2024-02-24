import {
    Cursor,
    SeekPage,
    TelemetryEventName,
    UserId,
    apId,
} from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ReferralEntity } from './referral.entity'
import { Referral } from '@activepieces/ee-shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { telemetry } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { logger } from 'server-shared'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'

const referralRepo = databaseConnection.getRepository(ReferralEntity)

export const referralService = {
    async upsert({
        referredUserId,
        referringUserId,
    }: UpsertParams): Promise<void> {
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
    await projectLimitsService.increaseTask(ownerProject.id, 500)

    logger.info({
        message: 'Added 500 tasks to project',
        projectId: ownerProject.id,
        includedTasks: newBilling.includedTasks,
    })
}


type UpsertParams = {
    referringUserId: string
    referredUserId: string
}