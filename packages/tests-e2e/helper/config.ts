type Config = {
    instanceUrl: string;
    email: string;
    password: string;
}

const localConfig: Config = {
    instanceUrl: 'https://pre-prod.activepieces.com',
    email: 'test@activepieces.com',
    password: 'Test@1234578',
}

const prodConfig: Config = {
    instanceUrl: process.env.E2E_INSTANCE_URL,
    email: process.env.E2E_EMAIL,
    password: process.env.E2E_PASSWORD
}

export const configUtils = {
    getConfig: (): Config => {
        return process.env.E2E_INSTANCE_URL ? prodConfig : localConfig;
    },
}