import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To use Campaign Monitor, you need to get an API key:
1. Login to your account at https://www.campaignmonitor.com.
2. Navigate to Account Settings.
3. Click on API Keys.
4. Create a new API key or use an existing one.
`;

export const campaignMonitorAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: markdownDescription,
    required: true,
});
