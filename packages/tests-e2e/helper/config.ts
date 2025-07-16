type Config = {
    instanceUrl: string;
    email: string;
    password: string;
}

const localConfig: Config = {
    instanceUrl: 'http://localhost:4200',
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