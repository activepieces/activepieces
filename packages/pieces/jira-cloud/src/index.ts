import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";

import { newWorklog } from "./lib/triggers/new-worklog";

export const jiraCloudAuth = PieceAuth.OAuth2({
    displayName: 'Authorization',
    authUrl: 'https://auth.atlassian.com/authorize?audience=api.atlassian.com',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    required: true,
    scope: ['read:jira-work', 'manage:jira-webhook'],
    props: {
        siteUrl: Property.ShortText({
            displayName: 'Site URL',
            required: true
        })
    }
});

export const jiraCloud = createPiece({
    displayName: "Jira Cloud",
    auth: jiraCloudAuth,
    minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/jira.png",
    authors: ['MoShizzle'],
    actions: [],
    triggers: [newWorklog],
});
