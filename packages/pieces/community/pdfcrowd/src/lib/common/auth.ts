import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const pdfcrowdAuth = PieceAuth.BasicAuth({
    displayName: 'Pdfcrowd Credentials',
    description: 'Your Pdfcrowd API credentials. Get them at https://pdfcrowd.com/user/account/',
    required: true,
    username: {
        displayName: 'Username',
        description: 'Your Pdfcrowd username',
    },
    password: {
        displayName: 'API Key',
        description: 'Your Pdfcrowd API key',
    },
});
