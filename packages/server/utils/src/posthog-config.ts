import { isNil } from '@activepieces/core-utils'

function projectToken(): string | null {
    const configured = process.env[PROJECT_TOKEN_ENV_VAR]
    if (isNil(configured)) {
        return DEFAULT_PROJECT_TOKEN
    }
    return configured.length > 0 ? configured : null
}

const PROJECT_TOKEN_ENV_VAR = 'AP_POSTHOG_PROJECT_TOKEN'
const DEFAULT_PROJECT_TOKEN = 'phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh'

export const posthogConfig = {
    host: 'https://us.i.posthog.com',
    projectToken,
    meteringProjectToken: DEFAULT_PROJECT_TOKEN,
}
