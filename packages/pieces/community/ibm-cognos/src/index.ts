import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Import actions
import { createDataSource } from './lib/action/create-data-source';
import { updateDataSource } from './lib/action/update-data-source';
import { deleteDataSource } from './lib/action/delete-data-source';
import { getDataSource } from './lib/action/get-data-source';
import { updateContentObject } from './lib/action/update-content-object';
import { moveContentObject } from './lib/action/move-content-object';
import { copyContentObject } from './lib/action/copy-content-object';
import { getContentObject } from './lib/action/get-content-object';
import { CognosAuthValue, createCognosSession } from './lib/common';

export const ibmCognosAuth = PieceAuth.CustomAuth({
    description: 'Authenticate with IBM Cognos Analytics',
    props: {
        baseUrl: Property.ShortText({
            displayName: 'Base URL',
            description: 'Your IBM Cognos Analytics instance URL (e.g., https://your-instance.cognos.cloud.ibm.com)',
            required: true,
        }),
        namespace: Property.ShortText({
            displayName: 'Namespace',
            description: 'CAM namespace (e.g., LDAP, Cognos, or your custom namespace)',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'Your IBM Cognos Analytics username',
            required: true,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Your IBM Cognos Analytics password',
            required: true,
        }),
    },
    required: true,
    validate: async ({ auth }) => {
        try {
            const cognosAuth = auth as CognosAuthValue;
            await createCognosSession(cognosAuth);
            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid credentials or unable to connect to IBM Cognos Analytics',
            };
        }
    },
});

export const ibmCognos = createPiece({
    displayName: 'IBM Cognos Analytics',
    description: 'Enterprise analytics and reporting platform',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/ibm-cognos.png',
    authors: ['RaghavArora14'],
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    auth: ibmCognosAuth,
    actions: [
        createDataSource,
        updateDataSource,
        deleteDataSource,
        getDataSource,
        updateContentObject,
        moveContentObject,
        copyContentObject,
        getContentObject,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const cognosAuth = auth as CognosAuthValue;
                return `${cognosAuth.baseUrl}/api/v1`;
            },
            auth: ibmCognosAuth,
            authMapping: async (auth) => {
                const cognosAuth = auth as CognosAuthValue;
                const sessionKey = await createCognosSession(cognosAuth);
                return {
                    'IBM-BA-Authorization': `CAM ${sessionKey}`,
                };
            },
        }),
    ],
    triggers: [],
});

