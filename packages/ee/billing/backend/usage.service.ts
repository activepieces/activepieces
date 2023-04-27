import { billingService } from "./billing.service";
import { ActivepiecesError, ErrorCode, FlowVersion, ProjectId, Trigger, Action, apId, Project, ApEdition } from "@activepieces/shared";
import { databaseConnection } from "@backend/database/database-connection";
import { ProjectUsage } from "@activepieces/ee/shared";
import { acquireLock } from "@backend/database/redis-connection";
import { ProjectUsageEntity } from "./usage.entity";
import { captureException } from "@backend/helper/logger";
import dayjs from "dayjs";
import { isNil } from "lodash";
import { getEdition } from "@backend/helper/secret-helper";

const projectUsageRepo = databaseConnection.getRepository<ProjectUsage>(ProjectUsageEntity);

export const usageService = {
    async addTasksConsumed(request: { projectId: ProjectId, tasks: number }): Promise<void> {
        const quotaLock = await acquireLock({
            key: `usage_${request.projectId}`,
            timeout: 30000,
        })
        try {
            const projectUsage = await usageService.getUsage({ projectId: request.projectId });
            projectUsage.consumedTasks += request.tasks;
            await projectUsageRepo.save(projectUsage);
        } finally {
            await quotaLock.release();
        }
    },
    async limit(request: { projectId: ProjectId; flowVersion: FlowVersion; }): Promise<void> {
        const edition = await getEdition()
        if (edition !== ApEdition.ENTERPRISE) {
            return;
        }
        const quotaLock = await acquireLock({
            key: `usage_${request.projectId}`,
            timeout: 30000,
        })

        try {
            const projectUsage = await usageService.getUsage({ projectId: request.projectId });
            const projectPlan = await billingService.getPlan({ projectId: request.projectId });
            if (projectUsage.consumedTasks > projectPlan.tasks) {
                throw new ActivepiecesError({
                    code: ErrorCode.TASK_QUOTA_EXCEEDED,
                    params: { projectId: request.projectId },
                });
            }
        } catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
                throw e;
            } else {
                // Ignore quota errors for sake of user experience and log them instead
                captureException(e);
            }
        } finally {
            await quotaLock.release();
        }
    },
    async getUsage({ projectId }: { projectId: ProjectId }): Promise<ProjectUsage> {
        let projectUsage = await findLatestProjectUsage(projectId);
        const plan = await billingService.getPlan({ projectId });
        const nextReset = nextResetDatetime(plan.subscriptionStartDatetime);
        if (isNil(projectUsage) || isNotSame(nextReset, projectUsage.nextResetDatetime)) {
            const projectUsage = await projectUsageRepo.save({
                id: apId(),
                projectId,
                consumedTasks: 0,
                nextResetDatetime: nextReset,
            });
            return projectUsage;
        }
        return projectUsage;
    },
}

async function findLatestProjectUsage(projectId: ProjectId) {
    return projectUsageRepo.findOne({
        where: {
            projectId
        },
        order: {
            nextResetDatetime: "DESC",
        }
    });
}

function isNotSame(firstDate: string, secondDate: string) {
    const fd = dayjs(firstDate);
    const sd = dayjs(secondDate);
    return !fd.isSame(sd);
}

function nextResetDatetime(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const date = dayjs(datetime);
    const currentDate = dayjs();
    const nextResetInMs = thirtyDaysInMs - (currentDate.diff(date, 'millisecond') % thirtyDaysInMs);
    return currentDate.add(nextResetInMs, 'millisecond').toISOString();
}

