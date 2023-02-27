import { billingService } from "./billing.service";
import { ActivepiecesError, ErrorCode, FlowVersion, ProjectId, Trigger, Action, apId } from "@activepieces/shared";
import { databaseConnection } from "@backend/database/database-connection";
import { createRedisLock } from "@backend/database/redis-connection";
import { ProjectUsage } from "../shared/usage";
import { ProjectUsageEntity } from "./usage.entity";
import { captureException, logger } from "@backend/helper/logger";
import dayjs from "dayjs";

const projectUsageRepo = databaseConnection.getRepository<ProjectUsage>(ProjectUsageEntity);

export const usageService = {
    async limit(request: { projectId: ProjectId; flowVersion: FlowVersion; }): Promise<{ perform: true }> {
        const quotaLock = await createRedisLock(5 * 1000);
        try {
            quotaLock.acquire(`usage_${request.projectId}}`);
            const projectUsage = await usageService.getUsage({ projectId: request.projectId });
            const numberOfSteps = countSteps(request.flowVersion);
            const projectPlan = await billingService.getPlan({ projectId: request.projectId });
            if (projectUsage.consumedTasks + numberOfSteps > projectPlan.tasks) {
                throw new ActivepiecesError({
                    code: ErrorCode.TASK_QUOTA_EXCEEDED,
                    params: { projectId: request.projectId },
                });
            }
            projectUsage.consumedTasks += numberOfSteps;
            await projectUsageRepo.save(projectUsage);
        } catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
                throw e;
            } else {
                // Ignore quota errors for sake of user experience and log them instead
                captureException(e);
            }
        } finally {
            quotaLock.release();
        };
        return {
            perform: true,
        }
    },
    async getUsage({ projectId }: { projectId: ProjectId }): Promise<ProjectUsage> {
        let projectUsage = await projectUsageRepo.findOneBy({ projectId });
        if (projectUsage === undefined || projectUsage === null || isPastResetDate(projectUsage.nextResetDatetime)) {
            const plan = await billingService.getPlan({ projectId });
            projectUsage = await projectUsageRepo.save({
                id: apId(),
                projectId,
                consumedTasks: 0,
                nextResetDatetime: nextResetDatetime(plan.subscriptionStartDatetime),
            });
        }
        return projectUsage;
    },
}


function countSteps(flowVersion: FlowVersion): number {
    let steps = 0;
    let currentStep: Trigger | Action | undefined = flowVersion.trigger;
    while (currentStep !== undefined) {
        currentStep = currentStep.nextAction;
        steps++;
    }
    return steps;
}

function isPastResetDate(datetime: string) {
    const date = dayjs(datetime);
    const currentDate = dayjs();
    return currentDate.isAfter(date);
}

function nextResetDatetime(datetime: string) {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const date = dayjs(datetime);
    const currentDate = dayjs();
    const nextResetInMs = thirtyDaysInMs - (currentDate.diff(date, 'millisecond') % thirtyDaysInMs);
    return currentDate.add(nextResetInMs, 'millisecond').toISOString();
}

