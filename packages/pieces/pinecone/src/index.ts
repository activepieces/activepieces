import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { pineconeCreateRecordAction } from './lib/actions/create-record';
export const pineconeAuth = PieceAuth.SecretText({
    displayName: 'API',
    required: true,
    description: 'Enter your API key',
})

export const airtable = createPiece({
    displayName: 'Pinecone',
        minimumSupportedRelease: '0.5.0',
    logoUrl: './img/pinecone.png',
    authors: ['nijfranck'],
    auth: pineconeAuth,
    actions: [
        pineconeCreateRecordAction,
    ],
    triggers: [
    ],
})
