import { PieceAuth, Property } from '@activepieces/pieces-framework';

const authDesc = `
Connect to your Oracle Fusion Cloud ERP instance using Basic Authentication.

**Required:**
- **Server URL**: Your Oracle Fusion instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)
- **Username**: Your Oracle Cloud username with API access
- **Password**: Your Oracle Cloud password

Contact your Oracle administrator if you need REST API access enabled.
`;

export const oracleFusionCloudErpAuth = PieceAuth.CustomAuth({
    description: authDesc,
    required: true,
    props: {
        serverUrl: Property.ShortText({
            displayName: 'Server URL',
            description: 'Your Oracle Fusion Cloud instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'Your Oracle Cloud username',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            description: 'Your Oracle Cloud password',
            required: true,
        }),
    },
});
