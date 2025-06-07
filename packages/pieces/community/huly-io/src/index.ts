import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { findPerson } from './lib/actions/find-person';
import { findProject } from './lib/actions/find-project';
import { findIssue } from './lib/actions/find-issue';
import { findDocument } from './lib/actions/find-document';
import { createPerson } from './lib/actions/create-person';
import { createIssue } from './lib/actions/create-issue';
import { createMilestone } from './lib/actions/create-milestone';
import { createDocument } from './lib/actions/create-document';

// Import triggers
import { newPersonCreated } from './lib/triggers/new-person-created';
import { newIssueCreated } from './lib/triggers/new-issue-created';
import { newMilestoneCreated } from './lib/triggers/new-milestone-created';
import { newDocumentCreated } from './lib/triggers/new-document-created';

const markdownDescription = `
To use Huly.io, you need to get an API key:
1. Log in to your Huly.io account.
2. Navigate to Settings > API.
3. Generate a new API key.
4. Copy the API key and paste it here.
`;

export const hulyIoAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: markdownDescription,
    required: true,
});

export const hulyIo = createPiece({
    displayName: 'Huly.io',
    description: 'Project and document management platform with WebSocket APIs',
    logoUrl: 'https://cdn.huly.io/logo.png', // Replace with actual logo URL
    authors: ['AnkitSharmaOnGithub'],
    auth: hulyIoAuth,
    minimumSupportedRelease: '0.36.1',
    actions: [
        // Search actions
        findPerson,
        findProject,
        findIssue,
        findDocument,

        // Create actions
        createPerson,
        createIssue,
        createMilestone,
        createDocument
    ],
    triggers: [
        newPersonCreated,
        newIssueCreated,
        newMilestoneCreated,
        newDocumentCreated
    ],
    categories: [PieceCategory.PRODUCTIVITY],
});
