import { BotPricingPlan, FlowPricingPlan, PlanSupportType, customPlanPrice, freePlanPrice } from '@activepieces/ee-shared'
import { Static, Type } from '@sinclair/typebox'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

export enum PlanType {
    BOTS = 'BOTS',
    FLOWS = 'FLOWS',
}

export const FlowPlanLimits = Type.Object({
    nickname: Type.String(),
    type: Type.Literal(PlanType.FLOWS),
    tasks: Type.Number(),
    activeFlows: Type.Number(),
    connections: Type.Number(),
    tasksPerDay: Type.Union([Type.Number(), Type.Null()]),
    minimumPollingInterval: Type.Number(),
    teamMembers: Type.Number(),
})

export type FlowPlanLimits = Static<typeof FlowPlanLimits>

export const BotPlanLimits = Type.Object({
    nickname: Type.String(),
    type: Type.Literal(PlanType.BOTS),
    bots: Type.Number(),
    datasources: Type.Number(),
    datasourcesSize: Type.Number(),
})

export type BotPlanLimits = Static<typeof BotPlanLimits>

export const PlanLimits = Type.Union([FlowPlanLimits, BotPlanLimits])

export type PlanLimits = Static<typeof PlanLimits>

export type ProjectLimitsMap = {
    [PlanType.FLOWS]: FlowPlanLimits
    [PlanType.BOTS]: BotPlanLimits
}

export const defaultPlanInformation: ProjectLimitsMap = JSON.parse(
    system.get(SystemProp.BILLING_SETTINGS) ?? '{}',
)


export const testBotsPricingPlan: BotPricingPlan[] = []

export const pricingPlans: FlowPricingPlan[] = [
    {
        name: 'Pro',
        description: 'Best for small businesses & power users',
        minimumPollingInterval: 5,
        teamMembers: 1,
        tasks: [
            {
                pricePlanId: '',
                amount: 1000,
                price: freePlanPrice,
            },
            {
                pricePlanId: 'price_1NBoi8KZ0dZRqLEKMd2iq8Jh',
                amount: 5000,
                price: '15',
            },
            {
                pricePlanId: 'price_1NBojJKZ0dZRqLEKZnub4P3o',
                amount: 10000,
                price: '25',
            },
            {
                pricePlanId: 'price_1NVimPKZ0dZRqLEK2yhv4TW2',
                amount: 25000,
                price: '55',
            },
            {
                pricePlanId: 'price_1NVinlKZ0dZRqLEKhW4ADCJ6',
                amount: 50000,
                price: '100',
            },
            {
                pricePlanId: 'price_1NBoklKZ0dZRqLEKMRehQVdn',
                amount: 100000,
                price: '175',
            },
            {
                pricePlanId: 'price_1NBoldKZ0dZRqLEK2vQi1jzE',
                amount: 200000,
                price: '300',
            },
            {
                pricePlanId: 'price_1NBomXKZ0dZRqLEKjZxjEfCB',
                amount: 500000,
                price: '500',
            },
        ],
        addons: {
            users:
            {
                pricePerUserPerMonth: '$5',
            },
        },
    },
    {
        description: 'Best for agencies who manage automations for multiple clients',
        name: 'Platform',
        minimumPollingInterval: 5,
        teamMembers: 25,
        customTemplates: true,
        customColorsAndLogos: true,
        supportType: PlanSupportType.EMAIL,
        addons: {
            users: {
                pricePerUserPerMonth: '$10',
            },
        },
        tasks: [
            {
                amount: 50000,
                price: '249',
                pricePlanId: '',
            },
        ],
        talkToUs: true,

    },
    {
        description: 'Advanced security, reporting and embedded automations',
        name: 'Enterprise',
        minimumPollingInterval: 1,
        teamMembers: 150,
        supportType: PlanSupportType.DEDICATED,
        tasks: [
            {
                amount: 1000000,
                price: customPlanPrice,
                pricePlanId: '',
            },
        ],
        auditLog: true,
        SSO: true,
        privatePieces: 'Unlimited',
        customReports: true,
        embedding: true,
        userPermissions: true,
        talkToUs: true,
    },
]
