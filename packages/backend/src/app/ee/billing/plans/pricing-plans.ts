import { BotPricingPlan, FlowPricingPlan } from '@activepieces/ee-shared'
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

/*
export const pricingPlans: PricingPlan[] = [
    {
        name: 'Test',
        description: 'Test plan',
        connections: 3,
        minimumPollingInterval: 15,
        teamMembers: -1,
        tasks: [
            {
                pricePlanId: 'price_1NBo8tKZ0dZRqLEKXLd8AQOW',
                amount: 10000,
                price: '10',
            },
            {
                pricePlanId: 'price_1NrMNeKZ0dZRqLEKZbAk8xG9',
                amount: 20000,
                price: '30',
            },
        ],
    },
]*/

export const testBotsPricingPlan: BotPricingPlan[] = []
export const pricingPlans: FlowPricingPlan[] = [
    {
        name: 'Hobbyist',
        description: 'Free plan',
        connections: 3,
        minimumPollingInterval: 15,
        teamMembers: -1,
        tasks: [
            {
                pricePlanId: '',
                amount: 100,
                price: '0',
            },
        ],
    },
    {
        name: 'Pro',
        description: 'Best for small businesses & power users',
        connections: 10,
        minimumPollingInterval: 5,
        teamMembers: 1,
        tasks: [
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
    },
    {
        name: 'Business',
        description: 'Best for businesses',
        connections: 100,
        minimumPollingInterval: 1,
        teamMembers: 5,
        tasks: [
            {
                pricePlanId: 'price_1NViZBKZ0dZRqLEKNqNwKL0E',
                amount: 5000,
                price: '115',
            },
            {
                pricePlanId: 'price_1NViXhKZ0dZRqLEKz7cmzW1g',
                amount: 10000,
                price: '125',
            },
            {
                pricePlanId: 'price_1NVia0KZ0dZRqLEKQRiTAAWi',
                amount: 25000,
                price: '155',
            },
            {
                pricePlanId: 'price_1NVibGKZ0dZRqLEKzRLNS2oV',
                amount: 50000,
                price: '200',
            },
            {
                pricePlanId: 'price_1NVibvKZ0dZRqLEKcuD9vN3n',
                amount: 100000,
                price: '275',
            },
            {
                pricePlanId: 'price_1NVicmKZ0dZRqLEKM6N9ynPb',
                amount: 200000,
                price: '400',
            },
            {
                pricePlanId: 'price_1NVidOKZ0dZRqLEK1nqewmgU',
                amount: 500000,
                price: '600',
            },
        ],
    },
]
