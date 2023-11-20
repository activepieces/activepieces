import { FlowPricingPlan } from "./plan"

// TEST ENVIRONMENT
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


export const DEFAULT_PLATFORM_PLAN = {
    tasks: 50000,
    connections: 100,
    nickname: 'platform',
    minimumPollingInterval: 5,
    teamMembers: 100,
}

export const trailPeriodDays = 14;


// PRODUCTION VALUES
/*export const proUserPriceId = 'price_1OCTD6KZ0dZRqLEKjmvmTgq6'
export const platformUserPriceId = ''
export const platformTasksPriceId = ''
export const platformBasePriceId = ''
export const proTasksPlanProd = [
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
]*/

export const pricingPlans: FlowPricingPlan[] = [
    {
        name: 'Pro',
        description: 'Best for small businesses & power users',
        pricePerUser: 5,
        includedTasks: 0,
        includedUsers: 1,
        tasks: proTasksPlan,
        contactUs: false,
        trail: false,
        custom: false,
        features: [
            {
                tooltip: "Some triggers are not instant, they check for updated data regularly, we call this period Sync time",
                description: "Sync Time: 5 minutes"
              },
              {
                tooltip: "Get support from our active community support forum",
                description: "Community support"
              },
        ]
    },
    {
        description: 'Best for agencies who manage automations for multiple clients',
        name: 'Platform',
        basePlanId: platformBasePriceId,
        includedUsers: 25,
        includedTasks: 50000,
        pricePerUser: 10,
        tasks: [...Array(1000).keys()].map(value => ({ pricePlanId: platformTasksPriceId, quantity: value, unitAmount: (value + 50) * 1000, unitPrice: 1.5 })),
        contactUs: true,
        custom: false,
        trail: true,
        features: [
            {
                tooltip: "Multiple projects for your customers under your platform",
                description: "Manage projects"
              },
              {
                tooltip: "Add your own custom pieces without contributing them to open source",
                description: "Private pieces: 2"
              },
              {
                tooltip: "Allow users to build flows using your predefined templates",
                description: "Custom templates"
              },
              {
                tooltip: "Match your brand identity across all projects under your platform",
                description: "Custom colors and logo"
              },
              {
                tooltip: "Get support from our active community support forum or from our support team via email",
                description: "Email and community support"
              },
        ]
    },
    {
        name: 'Enterprise',
        description: 'Advanced security, reporting and embedded automations',
        includedTasks: 1000000,
        includedUsers: 0,
        pricePerUser: 0,
        tasks: [],
        contactUs: true,
        trail: false,
        custom: true,
        features: [
            {
                tooltip: "Use our Javascript SDK to embed our automation builder in your app",
                description: "Embed in your Saas"
              },
              {
                tooltip: "Allow users to sign in using your existing provider",
                description: "Single Sign On (SSO)"
              },
              {
                tooltip: "Give your users custom permissions and roles",
                description: "User permissions"
              },
              {
                tooltip: "Request custom dashboards with the metrics you care about the most",
                description: "Custom reports"
              },
              {
                tooltip: "Get direct support via private Slack channel",
                description: "Dedicated support"
              }
        ],
    }
]
