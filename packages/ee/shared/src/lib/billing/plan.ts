import { ProjectId, BaseModel } from "@activepieces/shared";
import { ProjectUsage } from "./usage";

export type ProjectPlanId = string;

export interface ProjectPlan extends BaseModel<ProjectPlanId> {
    id: ProjectPlanId;
    projectId: ProjectId;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    subscriptionStartDatetime: string;
    flowPlanName: string;
    botPlanName: string;
    minimumPollingInterval: number;
    connections: number;
    teamMembers: number;
    datasources: number;
    activeFlows: number;
    tasks: number;
    datasourcesSize: number,
    bots: number;
    tasksPerDay?: number | null;
}


export interface MeteredSubPlan {
    pricePlanId: string;
    quantity: number;
    unitPrice: number;
    unitAmount: number;
}


export type BillingResponse = {
    defaultPlan: { nickname: string; },
    usage: ProjectUsage,
    plan: ProjectPlan,
    customerPortalUrl: string
}

export interface FlowPricingPlan {
    name: string;
    description: string;
    users: MeteredSubPlan[],
    tasks: MeteredSubPlan[];
    basePlanId?: string;
    contactUs: boolean;
    trail: boolean;
}

export const proUserPriceId = 'price_1O9o2PKZ0dZRqLEKtEV6Ae6Q'
export const platformUserPriceId = 'price_1O9uHWKZ0dZRqLEKAzuIB0Nc'
export const platformTasksPriceId = 'price_1O9uBMKZ0dZRqLEKp0YIeU2Z'
export const platformBasePriceId = 'price_1O9u1SKZ0dZRqLEKlKNONdSE'
export const proTasksPlan = [
    {
        pricePlanId: '',
        unitAmount: 1000,
        quantity: 1,
        unitPrice: 0,
    },
    {
        pricePlanId: 'price_1NBo8tKZ0dZRqLEKXLd8AQOW',
        unitAmount: 5000,
        unitPrice: 15,
        quantity: 1,
    },
]
export const trailPeriodDays = 14;
// PRODUCTION VALUES
/*
export const proTasksPlan = [
    {
        pricePlanId: '',
        unitAmount: 1000,
        quantity: 1,
        unitPrice: 0,
    },
    {
        pricePlanId: 'price_1NBoi8KZ0dZRqLEKMd2iq8Jh',
        unitAmount: 5000,
        unitPrice: 15,
        quantity: 1,
    },
    {
        pricePlanId: 'price_1NBojJKZ0dZRqLEKZnub4P3o',
        unitAmount: 10000,
        unitPrice: 25,
        quantity: 1
    },
    {
        pricePlanId: 'price_1NVimPKZ0dZRqLEK2yhv4TW2',
        unitAmount: 25000,
        unitPrice: 55,
        quantity: 1
    },
    {
        pricePlanId: 'price_1NVinlKZ0dZRqLEKhW4ADCJ6',
        unitAmount: 50000,
        unitPrice: 100,
        quantity: 1
    },
    {
        pricePlanId: 'price_1NBoklKZ0dZRqLEKMRehQVdn',
        unitAmount: 100000,
        unitPrice: 175,
        quantity: 1
    },
    {
        pricePlanId: 'price_1NBoldKZ0dZRqLEK2vQi1jzE',
        unitAmount: 200000,
        unitPrice: 300,
        quantity: 1
    },
    {
        pricePlanId: 'price_1NBomXKZ0dZRqLEKjZxjEfCB',
        unitAmount: 500000,
        unitPrice: 500,
        quantity: 1
    }
]
*/

export const pricingPlans: FlowPricingPlan[] = [
    {
        name: 'Pro',
        description: 'Best for small businesses & power users',
        users: [...Array(50).keys()].map(value => ({ pricePlanId: proUserPriceId, quantity: value, unitAmount: value + 1, unitPrice: 5 })),
        tasks: proTasksPlan,
        contactUs: false,
        trail: false,
    },
    {
        description: 'Best for agencies who manage automations for multiple clients',
        name: 'Platform',
        basePlanId: platformBasePriceId,
        users: [...Array(250).keys()].map(value => ({ pricePlanId: platformUserPriceId, quantity: value, unitAmount: value + 25, unitPrice: 10 })),
        tasks: [...Array(1000).keys()].map(value => ({ pricePlanId: platformTasksPriceId, quantity: value, unitAmount: (value + 50) * 1000, unitPrice: 1.5 })),
        contactUs: true,
        trail: true,
    },
    {
        description: 'Advanced security, reporting and embedded automations',
        name: 'Enterprise',
        users: [],
        tasks: [
            {
                unitAmount: 1000000,
                unitPrice: -1,
                quantity: 1,
                pricePlanId: '',
            },
        ],
        trail: true,
        contactUs: true,
    },
]
