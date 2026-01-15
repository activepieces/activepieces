
import {
    createPiece,
    OAuth2PropertyValue,
    PieceAuth,
    Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

const authDesc = `
**Oracle Fusion Cloud ERP Authentication Setup**

1. **Access Oracle Cloud Console**: Log in to your Oracle Cloud Console at https://cloud.oracle.com
2. **Navigate to Identity & Access Management**:
   - Go to Identity & Security → Domains
   - Select your domain
   - Go to Applications → Confidential Applications
3. **Create a New Application**:
   - Click "Create Application"
   - Choose "Confidential Application"
   - Enter a name and description
4. **Configure Authentication**:
   - Add allowed grant types: Authorization Code, Refresh Token
   - Add redirect URIs for OAuth2 flow
5. **Add Scopes**: Add the following scopes based on your needs:
   - \`https://www.oracle.com/fscmRestApi/fscmRestApi/read\`
   - \`https://www.oracle.com/fscmRestApi/fscmRestApi/write\`
   - \`https://www.oracle.com/fscmRestApi/fscmRestApi/manage\`
6. **Get Credentials**:
   - Copy the Client ID
   - Copy the Client Secret
7. **Enter Instance Details**:
   - Server URL: Your Oracle Fusion instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)
   - Environment: Production, Test, or Development

**Note**: Ensure your Oracle Fusion Cloud instance has the REST API enabled and proper security policies configured.
`;

export const oracleFusionCloudErpAuth = PieceAuth.OAuth2({
    description: authDesc,
    props: {
        server_url: Property.ShortText({
            displayName: 'Server URL',
            description: 'Your Oracle Fusion Cloud instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)',
            required: true,
        }),
        environment: Property.StaticDropdown({
            displayName: 'Environment',
            description: 'Choose the environment type',
            required: true,
            options: {
                options: [
                    {
                        label: 'Production',
                        value: 'prod',
                    },
                    {
                        label: 'Test',
                        value: 'test',
                    },
                    {
                        label: 'Development',
                        value: 'dev',
                    },
                ],
            },
            defaultValue: 'prod',
        }),
    },
    required: true,
    scope: [
        'https://www.oracle.com/fscmRestApi/fscmRestApi/read',
        'https://www.oracle.com/fscmRestApi/fscmRestApi/write',
        'https://www.oracle.com/fscmRestApi/fscmRestApi/manage',
    ],
    authUrl: 'https://{server_url}/oauth2/v1/authorize',
    tokenUrl: 'https://{server_url}/oauth2/v1/token',
});

import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { getRecord } from './lib/actions/get-record';
import { searchRecords } from './lib/actions/search-records';
import { newRecord } from './lib/triggers/new-record';

export const oracleFusionCloudErp = createPiece({
    displayName: 'Oracle Fusion Cloud ERP',
    description: 'Enterprise resource planning suite covering financials, procurement, project accounting, supply chain, and more.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/oracle-fusion-cloud-erp.png',
    authors: ['owuzo'],
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.ACCOUNTING],
    auth: oracleFusionCloudErpAuth,
    actions: [
        createRecord,
        updateRecord,
        deleteRecord,
        getRecord,
        searchRecords,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const authValue = auth as OAuth2PropertyValue;
                return `${authValue.props?.['server_url']}/fscmRestApi/resources/latest`;
            },
            auth: oracleFusionCloudErpAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [
        newRecord,
    ],
});
    