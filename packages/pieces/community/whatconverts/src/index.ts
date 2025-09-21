
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { whatconvertsAuth } from './lib/common/auth';
import { createLead } from './lib/actions/create-lead';
import { updateLead } from './lib/actions/update-lead';
import { createExport } from './lib/actions/create-export';
import { findLead } from './lib/actions/find-lead';
import { newLead } from './lib/triggers/new-lead';
import { updatedLead } from './lib/triggers/updated-lead';

export const whatconverts = createPiece({
    displayName: 'WhatConverts',
    description: 'Lead tracking and analytics platform that captures leads from phone calls, forms, chats, text messages, eCommerce transactions, etc. Create, update, export, and search for leads.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/whatconverts.png',
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING, PieceCategory.BUSINESS_INTELLIGENCE],
    authors: [],
    auth: whatconvertsAuth,
    actions: [
        createLead,
        updateLead,
        createExport,
        findLead,
        createCustomApiCallAction({
            baseUrl: () => 'https://app.whatconverts.com/api/v1',
            auth: whatconvertsAuth,
            authMapping: async (auth: any) => ({
                Authorization: `Basic ${Buffer.from(`${auth.api_key}`).toString('base64')}`,
            }),
        }),
    ],
    triggers: [
        newLead,
        updatedLead,
    ],
});
    