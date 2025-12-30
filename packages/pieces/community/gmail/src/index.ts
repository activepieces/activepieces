import {
    createCustomApiCallAction,
} from '@activepieces/pieces-common';
import {
    OAuth2PropertyValue,
    PieceAuth,
    createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email';
import { gmailNewStarredEmailTrigger } from './lib/triggers/new-starred-email';
import { gmailNewThreadTrigger } from './lib/triggers/new-thread';
import { gmailNewAttachmentTrigger } from './lib/triggers/new-attachment';
import { gmailNewLabelTrigger } from './lib/triggers/new-label';

export const gmailAuth = PieceAuth.OAuth2({
    description: '',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.labels', // Required for new-label trigger
    ],
});

export const gmail = createPiece({
    displayName: 'Gmail',
    description: 'Send and receive emails with Gmail',
    auth: gmailAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
    categories: [PieceCategory.COMMUNICATION, PieceCategory.APPS],
    authors: ['activepieces', 'kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'PsiquisX-User'],
    actions: [
        gmailSendEmailAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://gmail.googleapis.com/gmail/v1',
            auth: gmailAuth,
            authMapping: (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [
        gmailNewEmailTrigger,
        gmailNewLabeledEmailTrigger,
        gmailNewStarredEmailTrigger,
        gmailNewThreadTrigger,
        gmailNewAttachmentTrigger,
        gmailNewLabelTrigger
    ],
});

