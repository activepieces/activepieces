import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";

import { newEmail } from "./lib/triggers/new-email";

export const imapAuth = PieceAuth.CustomAuth({
    displayName: 'Authentication',
    description: 'Enter your IMAP server authentication details',
    props: {
        host: Property.ShortText({
            displayName: 'Host',
            description: 'The host of the IMAP server',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'The username of the IMAP server',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            description: 'The password of the IMAP server',
            required: true,
        }),
        port: Property.Number({
            displayName: 'Port',
            description: 'The port of the IMAP server',
            required: true,
            defaultValue: 143,
        }),
        tls: Property.Checkbox({
            displayName: 'Use TLS',
            defaultValue: false,
            required: true,
        }),
    },
    required: true
})

export const imap = createPiece({
    displayName: "IMAP",
    logoUrl: "https://cdn.activepieces.com/pieces/imap.png",
    authors: ['MoShizzle'],
    auth: imapAuth,
    actions: [],
    triggers: [newEmail],
});
