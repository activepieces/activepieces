import { billingService } from "./billing.service";
import { ActivepiecesError, ErrorCode, FlowVersion, ProjectId, Trigger, Action, apId } from "@activepieces/shared";
import { databaseConnection } from "@backend/database/database-connection";
import { ProjectPlan, ProjectUsage } from "@activepieces/ee/shared";
import { acquireLock } from "@backend/database/redis-connection";
import { ProjectUsageEntity } from "./usage.entity";
import { captureException } from "@backend/helper/logger";
import dayjs from "dayjs";
import sendgrid from '@sendgrid/mail';
import { SystemProp } from "@backend/helper/system/system-prop";
import { system } from "@backend/helper/system/system";
import { projectService } from "@backend/project/project.service";
import { userService } from "@backend/user/user-service";

sendgrid.setApiKey(system.get(SystemProp.SENDGRID_KEY));

const projectUsageRepo = databaseConnection.getRepository<ProjectUsage>(ProjectUsageEntity);

export const usageService = {
    async limit(request: { projectId: ProjectId; flowVersion: FlowVersion; }): Promise<{ perform: true }> {
        const quotaLock = await acquireLock({
            key: `usage_${request.projectId}`,
            timeout: 30000,
        })
        try {
            const projectUsage = await usageService.getUsage({ projectId: request.projectId });
            const numberOfSteps = countSteps(request.flowVersion);
            const projectPlan = await billingService.getPlan({ projectId: request.projectId });
            handleAlerts({ projectUsage: projectUsage!, projectPlan, numberOfSteps });
            if (projectUsage!.consumedTasks + numberOfSteps > projectPlan.tasks) {
                throw new ActivepiecesError({
                    code: ErrorCode.TASK_QUOTA_EXCEEDED,
                    params: { projectId: request.projectId },
                });
            }
            projectUsage!.consumedTasks += numberOfSteps;
            await projectUsageRepo.save(projectUsage!);
        } catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
                throw e;
            } else {
                // Ignore quota errors for sake of user experience and log them instead
                captureException(e);
            }
        } finally {
            await quotaLock.release();
        };
        return {
            perform: true,
        }
    },
    async getUsage({ projectId }: { projectId: ProjectId }): Promise<ProjectUsage | null> {
        let projectUsage = await projectUsageRepo.findOneBy({ projectId });
        const plan = await billingService.getPlan({ projectId });
        const nextReset = nextResetDatetime(plan.subscriptionStartDatetime);
        if (projectUsage === undefined || projectUsage === null || isNotSame(nextReset, projectUsage.nextResetDatetime)) {
            await projectUsageRepo.upsert({
                id: apId(),
                projectId,
                consumedTasks: 0,
                nextResetDatetime: nextReset,
            }, ['projectId']);
            return await projectUsageRepo.findOneBy({ projectId });
        }
        return projectUsage;
    },
}

async function handleAlerts({ projectUsage, projectPlan, numberOfSteps }: { projectUsage: ProjectUsage; projectPlan: ProjectPlan; numberOfSteps: number; }) {
    const alertingEmails = [
    {
        templateId: 'd-ff370bf352d940308714afdb37ea4b38',
        threshold: 0.5,
    },
    {
        threshold: 0.8,
        templateId: 'd-2159eff164df4f7fac246f04420858a2'
    },
    {
        threshold: 1.0,
        templateId: 'd-17ad40ee5ae34fc0914b8ce2648a393e '
    }];

    for (let i = 0; i < alertingEmails.length; ++i) {
        const thresholdEmail = alertingEmails[i];
        const threshold = Math.floor(projectUsage.consumedTasks / projectPlan.tasks);
        const newThreshold = Math.floor((projectUsage.consumedTasks + numberOfSteps) / projectPlan.tasks);
        if (threshold < thresholdEmail.threshold && newThreshold >= thresholdEmail.threshold) {
            const project = await projectService.getOne(projectUsage.projectId);
            const user = await userService.getMetaInfo({ id: project.ownerId });
            sendgrid.send({
                to: user.email,
                from: 'notifications@activepieces.com',
                templateId: thresholdEmail.templateId,
            })
        }
    }
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

