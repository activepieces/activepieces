import { PieceAuth } from "@activepieces/pieces-framework";

export const chartlyAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: `
    1. Visit chartly.dev to generate your free trial API key
    2. Create an account to manage your API keys and access higher limits
    3. Find your keys in your dashboard anytime
    4. API keys look like: trial_abc123...xyz789`,
    validate: async ({ auth }) => {
        try {
            const response = await fetch('https://api.chartly.dev/v1/status', {
                method: 'GET',
                headers: {
                    'X-Api-Key': auth,
                },
            });

            if (!response.ok) {
                return {
                    valid: false,
                    error: `Invalid API key: ${response.status} ${response.statusText}`,
                };
            }

            const data = await response.json();
            if (data.status !== 'ok') {
                return {
                    valid: false,
                    error: 'Chartly service is currently unhealthy',
                };
            }

            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: `Connection error: ${(error as Error).message}`,
            };
        }
    },
});
