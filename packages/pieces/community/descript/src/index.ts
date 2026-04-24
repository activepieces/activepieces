import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { descriptAgentEditAction } from './lib/actions/agent-edit';
import { descriptGetJobStatusAction } from './lib/actions/get-job-status';
import { descriptGetProjectAction } from './lib/actions/get-project';
import { descriptImportMediaAction } from './lib/actions/import-media';
import { descriptListProjectsAction } from './lib/actions/list-projects';
import { descriptPublishProjectAction } from './lib/actions/publish-project';
import { descriptJobCompletedTrigger } from './lib/triggers/job-completed';

export const descriptAuth = PieceAuth.SecretText({
    displayName: 'API Token',
    description: [
        'To create an API token:',
        '1. Open **Settings** in Descript.',
        '2. Select **API tokens** from the sidebar.',
        '3. Click **Create token**, give it a name, select a Drive, and click **Create token**.',
        '4. Copy the token and paste it here — you can only view it once.',
    ].join('\n'),
    required: true,
    validate: async ({ auth }) => {
        try {
            const token = getAuthToken(auth);
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://descriptapi.com/v1/projects?limit=1',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return { valid: true };
        } catch {
            return { valid: false, error: 'Invalid API token. Please check and try again.' };
        }
    },
});

export const descript = createPiece({
    displayName: 'Descript',
    description:
        'AI-powered video and podcast editor. Import media, run AI edits with Underlord, and publish.',
    minimumSupportedRelease: '0.82.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/descript.png',
    categories: [PieceCategory.CONTENT_AND_FILES],
    auth: descriptAuth,
    authors: ['hugh-codes'],
    actions: [
        descriptImportMediaAction,
        descriptAgentEditAction,
        descriptPublishProjectAction,
        descriptGetJobStatusAction,
        descriptListProjectsAction,
        descriptGetProjectAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://descriptapi.com/v1',
            auth: descriptAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${getAuthToken(auth)}`,
            }),
        }),
    ],
    triggers: [descriptJobCompletedTrigger],
});

function getAuthToken(
    auth: string | AppConnectionValueForAuthProperty<typeof descriptAuth>,
): string {
    return (typeof auth === 'string' ? auth : auth.secret_text).trim();
}
