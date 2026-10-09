import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { opnformAuth } from './lib/auth';
import { opnformClient } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-submission';

export const opnform = createPiece({
    displayName: 'Opnform',
    description: 'Create beautiful online forms and surveys with unlimited fields and submissions',
    auth: opnformAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/opnform.png',
    categories: [PieceCategory.FORMS_AND_SURVEYS],
    authors: ['JhumanJ', 'chiragchhatrala'],
    actions: [
        createCustomApiCallAction({
            auth: opnformAuth,
            baseUrl: (auth) => opnformClient.baseUrl({ auth }),
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.props.apiKey}`,
                };
            },
        }),
    ],
    triggers: [newSubmissionTrigger],
});
