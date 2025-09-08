type Config = {
    instanceUrl: string;
    email: string;
    password: string;
}

const localConfig: Config = {
    instanceUrl: 'https://cloud.activepieces.com',
    email: process.env.E2E_EMAIL ?? 'test@activepieces.com',
    password: process.env.E2E_PASSWORD ?? 'Test@1234578',
}

const enterpriseConfig: Config = {
    instanceUrl: process.env.E2E_ENTERPRISE_INSTANCE_URL,
    email: process.env.E2E_EMAIL,
    password: process.env.E2E_PASSWORD
}

const preProdConfig: Config = {
    instanceUrl: process.env.E2E_PRE_PROD_INSTANCE_URL,
    email: process.env.E2E_EMAIL,
    password: process.env.E2E_PASSWORD
}

const communityConfig: Config = {
    instanceUrl: process.env.E2E_COMMUNITY_INSTANCE_URL,
    email: process.env.E2E_EMAIL,
    password: process.env.E2E_PASSWORD
}

export const configUtils = {
    getConfig: (): Config => {
        switch (process.env.E2E_CONFIG_MODE) {
            case 'Enterprise':
                return enterpriseConfig;
            case 'Pre-Prod':
                return preProdConfig;
            case 'Community':
                return communityConfig;
            default:
                return localConfig;
        }
    },
}