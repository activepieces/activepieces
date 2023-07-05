import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { airtableCreateRecordAction } from './lib/actions/create-record';
import { airtableNewRecordTrigger } from './lib/trigger/new-record.trigger';

export const airtableAuth = PieceAuth.SecretText({
    displayName: 'Personal Token',
    required: true,
    description: `
    To obtain your personal token, follow these steps:

    1. Log in to your Airtable account.
    2. Visit https://airtable.com/create/tokens/ to create one
    3. Click on "+ Add a base" and select the base you want to use or all bases.
    4. Click on "+ Add a scope" and select "data.records.read" and "schema.bases.read".
    5. Click on "Create token" and copy the token.
    `,
})

export const airtable = createPiece({
    displayName: 'Airtable',
    logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
    authors: ['AbdulTheActivePiecer', 'kanarelo'],
    auth: airtableAuth,
    actions: [
        airtableCreateRecordAction,
    ],
    triggers: [
        airtableNewRecordTrigger,
    ],
})
