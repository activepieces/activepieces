import { ProjectId, apId } from "@activepieces/shared";
import { databaseConnection } from "@backend/database/database-connection";
import { acquireLock } from "@backend/database/redis-connection";
import { logger } from "@backend/helper/logger";
import { projectService } from "@backend/project/project.service";
import { userService } from "@backend/user/user-service";
import { SystemProp } from "@backend/helper/system/system-prop";
import { system } from "@backend/helper/system/system";
import { ProjectPlan } from "@activepieces/ee/shared";
import { ProjectPlanEntity } from "./plan.entity";
import Stripe from 'stripe';
import dayjs from "dayjs";

const projectPlanRepo = databaseConnection.getRepository<ProjectPlan>(ProjectPlanEntity);
const stripeSecret = system.get(SystemProp.STRIPE_SECRET_KEY);
export const stripe = new Stripe(stripeSecret!, {
    apiVersion: '2022-11-15',
});

type BillingSettings = {
    defaultPlanId: string;
}

const billingSettings: BillingSettings = JSON.parse(system.get(SystemProp.BILLING_SETTINGS) ?? "{}");

function getDefaultPlan(): Promise<Stripe.Plan> {
    return stripe.plans.retrieve(billingSettings.defaultPlanId);
}

function getDetailsFromStripe(plan: Stripe.Plan): { tasks: number, nickname: string } {
    const tasks = plan?.metadata?.['tasks'];
    const nickname = plan.nickname;
    if (!nickname || !tasks) {
        throw new Error(`Plan ${nickname} has no tasks specified`);
    }
    return { tasks: Number(tasks), nickname };
}


export const billingService = {
    async getPlan({ projectId }: { projectId: ProjectId }): Promise<ProjectPlan> {
        const plan = await projectPlanRepo.findOneBy({ projectId });
        if (plan === undefined || plan === null) {
            return await createStripeDetails({ projectId });
        }
        return plan;
    },
    async handleWebhook({ webhook }: { webhook: Stripe.Event }) {
        const subscription = webhook.data.object as Stripe.Subscription;
        const projectPlan = await projectPlanRepo.findOneBy({ stripeCustomerId: subscription.customer.toString() });
        if (projectPlan === undefined || projectPlan === null) {
            throw new Error('No project plan found for customer ' + subscription.customer);
        }
        switch (webhook.type) {
            case "customer.subscription.created":
                await updatePlan({
                    projectPlan: projectPlan,
                    stripeSubscription: subscription,
                });
                break;
            case "customer.subscription.deleted":
                await downgradeToFreeTier({
                    projectId: projectPlan.projectId,
                });
                break;
            case "customer.subscription.updated":
                if (subscription.status === "canceled" || subscription.status === "unpaid") {
                    await downgradeToFreeTier({
                        projectId: projectPlan.projectId,
                    });
                } else {
                    await updatePlan({
                        projectPlan: projectPlan,
                        stripeSubscription: subscription,
                    });
                }
                break;
            default:
                break;
        }
    },
    async createPortalSessionUrl({ projectId }: { projectId: ProjectId }): Promise<String> {
        const plan = await billingService.getPlan({ projectId });
        const session = await stripe.billingPortal.sessions.create({
            customer: plan.stripeCustomerId,
            return_url: `https://cloud.activepieces.com/`,
        });
        return session.url;
    }
}

async function updatePlan({ projectPlan, stripeSubscription }: { projectPlan: ProjectPlan, stripeSubscription: Stripe.Subscription }): Promise<void> {
    logger.info('Updating plan for project ' + projectPlan.projectId)
    const projectPlanLock = await acquireLock({
        key: `project_plan_${projectPlan.projectId}`,
        timeout: 30 * 1000,
    });
    try {
        const plan = getDetailsFromStripe(stripeSubscription.items.data[0].plan);
        await projectPlanRepo.update(projectPlan.id, {
            ...projectPlan,
            tasks: plan.tasks,
            name: plan.nickname,
            stripeSubscriptionId: stripeSubscription.id,
            subscriptionStartDatetime: dayjs.unix(stripeSubscription.current_period_start).toISOString()
        });
    } finally {
        await projectPlanLock.release();
    }
}

async function downgradeToFreeTier({ projectId }: { projectId: ProjectId }): Promise<void> {
    logger.info('Downgrading project ' + projectId + ' to free tier');
    const projectPlanLock = await acquireLock({
        key: `project_plan_${projectId}`,
        timeout: 30 * 1000,
    });
    const defaultPlanId = billingSettings.defaultPlanId;
    try {
        const currentPlan = await projectPlanRepo.findOneBy({ projectId });
        const planLimits = await getDetailsFromStripe(await getDefaultPlan());
        const stripeSubscription = await stripe.subscriptions.create({
            customer: currentPlan!.stripeCustomerId,
            items: [{ plan: defaultPlanId }],
        });
        await projectPlanRepo.update(currentPlan!.id, {
            ...currentPlan,
            tasks: planLimits.tasks,
            name: defaultPlanId,
            stripeSubscriptionId: stripeSubscription.id,
            subscriptionStartDatetime: dayjs.unix(stripeSubscription.current_period_start).toISOString(),
        });
    } finally {
        await projectPlanLock.release();
    }
}

async function createStripeDetails({ projectId }: { projectId: ProjectId }): Promise<ProjectPlan> {
    const projectPlanLock = await acquireLock({
        key: `project_plan_${projectId}`,
        timeout: 30 * 1000,
    });
    const defaultPlanId = billingSettings.defaultPlanId;
    try {
        const currentPlan = await projectPlanRepo.findOneBy({ projectId });
        if (currentPlan !== undefined && currentPlan !== null) {
            return currentPlan;
        }
        const project = await projectService.getOne(projectId);
        const user = await userService.getMetaInfo({ id: project!.ownerId });
        const planLimits = await getDetailsFromStripe(await getDefaultPlan());
        const stripeCustomer = await stripe.customers.create({
            email: user!.email,
            name: user!.firstName + " " + user!.lastName,
            description: 'User Id: ' + user!.id + ' Project Id: ' + projectId,
        });
        const stripeSubscription = await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            backdate_start_date: dayjs(project!.created).unix(),
            items: [{ plan: defaultPlanId }],
        });
        await projectPlanRepo.upsert({
            id: apId(),
            projectId,
            tasks: planLimits.tasks,
            name: defaultPlanId,
            stripeCustomerId: stripeCustomer.id,
            stripeSubscriptionId: stripeSubscription.id,
            subscriptionStartDatetime: project!.created,
        }, ['projectId']);
        return (await projectPlanRepo.findOneBy({ projectId }))!;
    } finally {
        await projectPlanLock.release();
    }
}
