import { FlowPricingPlan } from "./plan"

// TEST ENVIRONMENT
/* export const proUserPriceId = 'price_1O9o2PKZ0dZRqLEKtEV6Ae6Q'
export const platformUserPriceId = 'price_1O9uHWKZ0dZRqLEKAzuIB0Nc'
export const platformTasksPriceId = 'price_1O9uBMKZ0dZRqLEKp0YIeU2Z'
export const platformBasePriceId = 'price_1O9u1SKZ0dZRqLEKlKNONdSE'
export const proTasksPlanProd = [
    {
        pricePlanId: '',
        unitAmount: 1000,
        planPrice: 0,
    },
    {
        pricePlanId: 'price_1NBo8tKZ0dZRqLEKXLd8AQOW',
        unitAmount: 5000,
        planPrice: 15,
    },
]*/


// PRODUCTION VALUES
export const proUserPriceId = 'price_1OFlnBKZ0dZRqLEK2nVlTICg'
export const platformUserPriceId = ''
export const platformTasksPriceId = ''
export const platformBasePriceId = ''
export const proTasksPlanProd = [
  {
    pricePlanId: '',
    unitAmount: 1000,
    planPrice: 0,
  },
  {
    pricePlanId: 'price_1NBoi8KZ0dZRqLEKMd2iq8Jh',
    unitAmount: 5000,
    planPrice: 15,

  },
  {
    pricePlanId: 'price_1NBojJKZ0dZRqLEKZnub4P3o',
    unitAmount: 10000,
    planPrice: 25,
  },
  {
    pricePlanId: 'price_1NVimPKZ0dZRqLEK2yhv4TW2',
    unitAmount: 25000,
    planPrice: 55,
  },
  {
    pricePlanId: 'price_1NVinlKZ0dZRqLEKhW4ADCJ6',
    unitAmount: 50000,
    planPrice: 100,
  },
  {
    pricePlanId: 'price_1NBoklKZ0dZRqLEKMRehQVdn',
    unitAmount: 100000,
    planPrice: 175,
  },
  {
    pricePlanId: 'price_1NBoldKZ0dZRqLEK2vQi1jzE',
    unitAmount: 200000,
    planPrice: 300,
  },
  {
    pricePlanId: 'price_1NBomXKZ0dZRqLEKjZxjEfCB',
    unitAmount: 500000,
    planPrice: 500,
  }
]

export const DEFAULT_PLATFORM_PLAN = {
  tasks: 50000,
  connections: 100,
  nickname: 'platform',
  minimumPollingInterval: 5,
  teamMembers: 10,
}

export const pricingPlans: FlowPricingPlan[] = [
  {
    name: 'Pro',
    description: 'Best for small businesses & power users',
    pricePerUser: 5,
    includedTasks: 0,
    includedUsers: 1,
    tasks: proTasksPlanProd,
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
    tasks: [...Array(951).keys()].map(value => ({ pricePlanId: platformTasksPriceId, unitAmount: ((value) + 50) * 1000, planPrice: value === 0 ? 249 : 249 + (1.5 * value) })),
    contactUs: true,
    custom: false,
    trail: true,
    features: [
      {
        tooltip: "Some triggers are not instant, they check for updated data regularly, we call this period Sync time",
        description: "Sync Time: 5 minutes"
      },
      {
        tooltip:'',
        description:'50,000 tasks per month then $1.5 per 1,000 tasks'
      },
      {
        tooltip: "Multiple projects for your customers under your platform",
        description: "Manage projects"
      },
      {
        tooltip: "Add your own custom pieces without contributing them to open source",
        description: "2 private pieces"
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
    includedUsers: 150,
    pricePerUser: 0,
    tasks: [],
    contactUs: true,
    trail: false,
    custom: true,
    features: [
      {
        tooltip: "Some triggers are not instant, they check for updated data regularly, we call this period Sync time",
        description: "Sync Time: 1 minutes"
      },
      {
        tooltip: "Use our Javascript SDK to embed our automation builder in your app",
        description: "Embed in your Saas"
      },
      {
        tooltip: "Add your own custom pieces without contributing them to open source",
        description: "Unlimited private pieces"
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
