import { billingService } from "./billing.service";
import { ActivepiecesError, ErrorCode, FlowVersion, ProjectId, Trigger, Action, apId, Project, ApEdition } from "@activepieces/shared";
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
import { isNil } from "lodash";
import { getEdition } from "@backend/helper/secret-helper";


const sendgridKey = system.get(SystemProp.SENDGRID_KEY);
const projectUsageRepo = databaseConnection.getRepository<ProjectUsage>(ProjectUsageEntity);
if (sendgridKey) {
    sendgrid.setApiKey(sendgridKey);
}

export const usageService = {
    async addTasksConsumed(request: { projectId: ProjectId, tasks: number }): Promise<void> {
        const quotaLock = await acquireLock({
            key: `usage_${request.projectId}`,
            timeout: 30000,
        })
        try {
            const projectUsage = await usageService.getUsage({ projectId: request.projectId });
            const projectPlan = await billingService.getPlan({ projectId: request.projectId });
            handleAlerts({ projectUsage: projectUsage!, projectPlan, numberOfSteps: request.tasks });

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

async function handleAlerts({ projectUsage, projectPlan, numberOfSteps }: { projectUsage: ProjectUsage; projectPlan: ProjectPlan; numberOfSteps: number; }) {
    const alertingEmails = [
        {
            templateId: 'd-ff370bf352d940308714afdb37ea4b38',
            threshold: 0.5,
        },
        {
            threshold: 0.9,
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
            const project = (await projectService.getOne(projectUsage.projectId))!;
            const user = (await userService.getMetaInfo({ id: project.ownerId }))!;
            sendgrid.send({
                to: user.email,
                from: 'notifications@activepieces.com',
                templateId: thresholdEmail.templateId,
            })
        }
    }
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

