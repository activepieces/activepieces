import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { gmailSendEmailAction } from './lib/actions/send-email-action';

export const gmailAuth = PieceAuth.OAuth2({
    description: "",

    authUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    required: true,
    // TODO add https://www.googleapis.com/auth/gmail.readonly when we have the permission
    scope: ["https://www.googleapis.com/auth/gmail.send", 'email']
})

export const gmail = createPiece({
    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
    actions: [gmailSendEmailAction],
    displayName: 'Gmail',
    authors: ['AbdulTheActivePiecer', 'kanarelo', 'BastienMe', 'PFernandez98'],
    triggers: [],
    auth: gmailAuth,
});
